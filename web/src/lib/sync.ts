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
  const localOn = ts(local.onboardedAt);
  const remoteOn = ts(remote.onboardedAt);
  const base = remoteOn >= localOn ? remote : local;
  const other = base === remote ? local : remote;
  return normalizeProfile({
    ...other,
    ...base,
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
 * localStorage es por cuenta: si cambia el userId, se limpia antes
 * (así no se suben ideas/perfil de otra persona a Supabase).
 */
export async function enableCloudSync(user: User): Promise<void> {
  const previousOwner = getLocalOwnerId();
  const sameOwner = previousOwner === user.id;

  if (!sameOwner) {
    // Otro usuario, o primer login tras el flag de owner: no heredar local.
    clearLocalWorkspace();
  }

  setLocalOwnerId(user.id);
  currentUserId = user.id;
  syncEnabled = true;

  if (sameOwner) {
    await pullAndMerge();
  } else {
    await pullRemoteOnly();
  }
  await pushAll();
}

export function disableCloudSync(): void {
  syncEnabled = false;
  currentUserId = null;
  if (typeof window !== "undefined" && pushTimer) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }
}

/** Programa push tras cambios locales (debounce). */
export function scheduleCloudPush(): void {
  if (!isCloudSyncEnabled()) return;
  if (typeof window === "undefined") return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushAll();
  }, 600);
}

async function fetchRemote(): Promise<{
  remoteProfile: CreatorProfile | null;
  remoteIdeas: Idea[];
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase || !currentUserId) {
    return { remoteProfile: null, remoteIdeas: [] };
  }

  const [{ data: profileRow }, { data: ideaRows, error: ideasError }] =
    await Promise.all([
      supabase
        .from("creator_profiles")
        .select("profile, updated_at")
        .eq("user_id", currentUserId)
        .maybeSingle(),
      supabase
        .from("creator_ideas")
        .select("id, idea, updated_at")
        .eq("user_id", currentUserId),
    ]);

  if (ideasError) throw ideasError;

  const remoteProfile = profileRow?.profile
    ? (profileRow.profile as CreatorProfile)
    : null;
  const remoteIdeas = (ideaRows || [])
    .map((row) => row.idea as Idea)
    .filter(Boolean);

  return { remoteProfile, remoteIdeas };
}

/** Tras cambio de cuenta: solo lo que hay en la nube de este user. */
async function pullRemoteOnly(): Promise<void> {
  if (!currentUserId || syncing) return;
  syncing = true;
  try {
    const { remoteProfile, remoteIdeas } = await fetchRemote();
    if (remoteProfile) writeProfileLocal(remoteProfile);
    else writeProfileLocal(null);
    writeIdeasLocal(remoteIdeas);
    emitSynced();
  } finally {
    syncing = false;
  }
}

export async function pullAndMerge(): Promise<void> {
  if (!currentUserId || syncing) return;
  syncing = true;
  try {
    const { remoteProfile, remoteIdeas } = await fetchRemote();

    const mergedProfile = mergeProfiles(getProfile(), remoteProfile);
    const mergedIdeas = mergeIdeas(getIdeas(), remoteIdeas);

    if (mergedProfile) writeProfileLocal(mergedProfile);
    writeIdeasLocal(mergedIdeas);
    emitSynced();
  } finally {
    syncing = false;
  }
}

export async function pushAll(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase || !currentUserId || syncing) return;
  syncing = true;
  try {
    const profile = getProfile();
    const ideas = getIdeas();

    if (profile) {
      const { error } = await supabase.from("creator_profiles").upsert({
        user_id: currentUserId,
        profile,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    if (ideas.length > 0) {
      const rows = ideas.map((idea) => ({
        user_id: currentUserId!,
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
