import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  clearLocalWorkspace,
  getIdeas,
  getLocalOwnerId,
  getProfile,
  setLocalOwnerId,
} from "@/lib/storage";
import { normalizeProfile } from "@/lib/profile-context";
import type { CreatorProfile, Idea } from "@/lib/types";

const PROFILE_STORAGE_KEY = "creatoros_profile_v1";
const IDEAS_STORAGE_KEY = "creatoros_ideas_v1";
const SYNC_EVENT = "creatoros-synced";

let syncEnabled = false;
let currentUserId: string | null = null;
/** Incrementa en cada enable/disable para ignorar resultados stale. */
let syncGeneration = 0;
let pushTimer: number | null = null;
let syncing = false;

export function isCloudSyncEnabled(): boolean {
  return isSupabaseConfigured() && syncEnabled && Boolean(currentUserId);
}

export function onSynced(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => listener();
  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}

function emitSynced() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function ts(iso?: string): number {
  if (!iso) return 0;
  const n = new Date(iso).getTime();
  return Number.isFinite(n) ? n : 0;
}

function profileUpdatedAt(profile: CreatorProfile): number {
  return ts(profile.updatedAt) || ts(profile.onboardedAt);
}

function isStale(gen: number, userId: string): boolean {
  return gen !== syncGeneration || currentUserId !== userId || !syncEnabled;
}

/** Last-write-wins por updatedAt. */
export function mergeIdeas(local: Idea[], remote: Idea[]): Idea[] {
  const map = new Map<string, Idea>();
  for (const idea of local) map.set(idea.id, idea);
  for (const idea of remote) {
    const prev = map.get(idea.id);
    if (!prev || ts(idea.updatedAt) >= ts(prev.updatedAt)) {
      map.set(idea.id, idea);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => ts(b.updatedAt) - ts(a.updatedAt)
  );
}

export function mergeProfiles(
  local: CreatorProfile | null,
  remote: CreatorProfile | null
): CreatorProfile | null {
  if (!local) return remote ? normalizeProfile(remote) : null;
  if (!remote) return normalizeProfile(local);
  const localOn = profileUpdatedAt(local);
  const remoteOn = profileUpdatedAt(remote);
  const base = remoteOn >= localOn ? remote : local;
  const other = base === remote ? local : remote;
  return normalizeProfile({
    ...other,
    ...base,
    updatedAt:
      ts(base.updatedAt) >= ts(other.updatedAt)
        ? base.updatedAt || other.updatedAt
        : other.updatedAt || base.updatedAt,
    brand: { ...other.brand, ...base.brand } as CreatorProfile["brand"],
    recordingStyle: {
      ...other.recordingStyle,
      ...base.recordingStyle,
    } as CreatorProfile["recordingStyle"],
    youtube: base.youtube ?? other.youtube ?? null,
    youtubeCache: base.youtubeCache ?? other.youtubeCache ?? null,
    gamesLibrary: base.gamesLibrary?.length
      ? base.gamesLibrary
      : other.gamesLibrary,
    provenHooks: base.provenHooks?.length
      ? base.provenHooks
      : other.provenHooks,
    workspaceMode: base.workspaceMode ?? other.workspaceMode,
  });
}

/**
 * Activa sync para este usuario.
 * localStorage es por cuenta: si cambia el userId, se limpia tras fetch remoto
 * (así no se suben ideas/perfil de otra persona a Supabase).
 */
export async function enableCloudSync(user: User): Promise<void> {
  const gen = ++syncGeneration;
  const userId = user.id;
  const previousOwner = getLocalOwnerId();
  const sameOwner = previousOwner === userId;

  if (typeof window !== "undefined" && pushTimer) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }

  currentUserId = userId;
  syncEnabled = true;

  if (sameOwner) {
    setLocalOwnerId(userId);
    await pullAndMergeFor(userId, gen);
  } else {
    await pullRemoteReplaceFor(userId, gen);
  }
  if (isStale(gen, userId)) return;
  await pushAllFor(userId, gen);
}

export function disableCloudSync(): void {
  syncGeneration += 1;
  syncEnabled = false;
  currentUserId = null;
  if (typeof window !== "undefined" && pushTimer) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }
}

/** Programa push tras cambios locales (debounce). */
export function scheduleCloudPush(): void {
  if (!isCloudSyncEnabled() || !currentUserId) return;
  if (typeof window === "undefined") return;
  const userId = currentUserId;
  const gen = syncGeneration;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushAllFor(userId, gen);
  }, 600);
}

async function fetchRemote(userId: string): Promise<{
  remoteProfile: CreatorProfile | null;
  remoteIdeas: Idea[];
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { remoteProfile: null, remoteIdeas: [] };
  }

  const [
    { data: profileRow, error: profileError },
    { data: ideaRows, error: ideasError },
  ] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("profile, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("creator_ideas")
      .select("id, idea, updated_at")
      .eq("user_id", userId),
  ]);

  if (profileError) throw profileError;
  if (ideasError) throw ideasError;

  const remoteProfile = profileRow?.profile
    ? ({
        ...(profileRow.profile as CreatorProfile),
        updatedAt:
          (profileRow.profile as CreatorProfile).updatedAt ||
          profileRow.updated_at ||
          undefined,
      } as CreatorProfile)
    : null;
  const remoteIdeas = (ideaRows || [])
    .map((row) => row.idea as Idea)
    .filter(Boolean);

  return { remoteProfile, remoteIdeas };
}

/** Cambio de cuenta: fetch remoto → luego reemplaza local. */
async function pullRemoteReplaceFor(
  userId: string,
  gen: number
): Promise<void> {
  if (syncing) {
    // Espera breve a que termine otra op; si sigue stale, aborta
    await new Promise((r) => setTimeout(r, 50));
  }
  if (isStale(gen, userId)) return;

  syncing = true;
  try {
    let remote: { remoteProfile: CreatorProfile | null; remoteIdeas: Idea[] };
    try {
      remote = await fetchRemote(userId);
    } catch (err) {
      if (isStale(gen, userId)) return;
      // Aísla: no heredar local ajeno aunque falle la red
      clearLocalWorkspace();
      setLocalOwnerId(userId);
      throw err;
    }
    if (isStale(gen, userId)) return;
    clearLocalWorkspace();
    setLocalOwnerId(userId);
    if (remote.remoteProfile) writeProfileLocal(remote.remoteProfile);
    else writeProfileLocal(null);
    writeIdeasLocal(remote.remoteIdeas);
    emitSynced();
  } finally {
    syncing = false;
  }
}

async function pullAndMergeFor(userId: string, gen: number): Promise<void> {
  if (syncing) return;
  if (isStale(gen, userId)) return;
  syncing = true;
  try {
    const { remoteProfile, remoteIdeas } = await fetchRemote(userId);
    if (isStale(gen, userId)) return;

    const mergedProfile = mergeProfiles(getProfile(), remoteProfile);
    const mergedIdeas = mergeIdeas(getIdeas(), remoteIdeas);

    if (mergedProfile) writeProfileLocal(mergedProfile);
    writeIdeasLocal(mergedIdeas);
    emitSynced();
  } finally {
    syncing = false;
  }
}

export async function pullAndMerge(): Promise<void> {
  if (!currentUserId) return;
  await pullAndMergeFor(currentUserId, syncGeneration);
}

async function pushAllFor(userId: string, gen: number): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase || isStale(gen, userId) || syncing) return;
  syncing = true;
  try {
    if (isStale(gen, userId)) return;
    const profile = getProfile();
    const ideas = getIdeas();

    if (profile) {
      const { error } = await supabase.from("creator_profiles").upsert({
        user_id: userId,
        profile,
        updated_at: profile.updatedAt || new Date().toISOString(),
      });
      if (error) throw error;
    }

    if (isStale(gen, userId)) return;

    if (ideas.length > 0) {
      const rows = ideas.map((idea) => ({
        user_id: userId,
        id: idea.id,
        idea,
        updated_at: idea.updatedAt || new Date().toISOString(),
      }));
      const { error } = await supabase.from("creator_ideas").upsert(rows);
      if (error) throw error;
    }
  } catch (err) {
    console.error("[sync] push failed", err);
  } finally {
    syncing = false;
  }
}

export async function pushAll(): Promise<void> {
  if (!currentUserId) return;
  await pushAllFor(currentUserId, syncGeneration);
}

function writeProfileLocal(profile: CreatorProfile | null): void {
  if (typeof window === "undefined") return;
  if (!profile) {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(normalizeProfile(profile))
  );
}

function writeIdeasLocal(ideas: Idea[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
}
