import {
  BRAND_KIT,
  CONTENT_OS_IMPORT_KEY,
  CONTENT_OS_IMPORT_VERSION,
  PROVEN_HOOKS,
  SEED_GAMES,
  buildSeedIdeas,
} from "./content-os-seed";
import { normalizeProfile } from "./profile-context";
import { clearNotes } from "./notes";
import type { CreatorProfile, Idea } from "./types";
import { DEFAULT_BRAND } from "./user1-defaults";

const PROFILE_KEY = "creatoros_profile_v1";
const IDEAS_KEY = "creatoros_ideas_v1";
/** Quién “posee” el localStorage actual (Supabase user id). */
export const LOCAL_OWNER_KEY = "creatoros_local_owner_v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getLocalOwnerId(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(LOCAL_OWNER_KEY);
}

export function setLocalOwnerId(userId: string): void {
  if (!canUseStorage()) return;
  localStorage.setItem(LOCAL_OWNER_KEY, userId);
}

/** Borra perfil/ideas/notas/import flag locales (cambio de cuenta). */
export function clearLocalWorkspace(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(IDEAS_KEY);
  localStorage.removeItem(CONTENT_OS_IMPORT_KEY);
  clearNotes();
}

/** Avisa al módulo de sync sin import circular. */
function notifyCloudSync(): void {
  void import("./sync")
    .then((m) => m.scheduleCloudPush())
    .catch(() => undefined);
}

/** Parse sin ordenar — para lecturas/escrituras internas. */
function readIdeasRaw(): Idea[] {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(IDEAS_KEY);
  if (!raw) return [];
  try {
    const ideas = JSON.parse(raw) as Idea[];
    return Array.isArray(ideas) ? ideas : [];
  } catch {
    return [];
  }
}

export function getProfile(): CreatorProfile | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return normalizeProfile(JSON.parse(raw) as CreatorProfile);
  } catch {
    return null;
  }
}

export function saveProfile(profile: CreatorProfile): void {
  if (!canUseStorage()) return;
  const stamped: CreatorProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(normalizeProfile(stamped))
  );
  notifyCloudSync();
}

export function getIdeas(): Idea[] {
  return readIdeasRaw().sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveIdeas(ideas: Idea[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  notifyCloudSync();
}

export function getIdea(id: string): Idea | null {
  return readIdeasRaw().find((i) => i.id === id) ?? null;
}

export function upsertIdea(idea: Idea): void {
  const ideas = readIdeasRaw();
  const idx = ideas.findIndex((i) => i.id === idea.id);
  if (idx >= 0) ideas[idx] = idea;
  else ideas.unshift(idea);
  saveIdeas(ideas);
}

/** Merge atómico sobre el registro actual en storage (evita lost updates). */
export function patchIdea(
  id: string,
  patch: Partial<Idea> | ((current: Idea) => Partial<Idea>)
): Idea | null {
  const ideas = readIdeasRaw();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const current = ideas[idx];
  const delta = typeof patch === "function" ? patch(current) : patch;
  const next: Idea = { ...current, ...delta };
  // undefined en el patch elimina la clave (p. ej. invalidar title)
  for (const key of Object.keys(delta) as (keyof Idea)[]) {
    if (delta[key] === undefined) {
      delete next[key];
    }
  }
  ideas[idx] = next;
  saveIdeas(ideas);
  return next;
}

export function deleteIdea(id: string): void {
  saveIdeas(readIdeasRaw().filter((i) => i.id !== id));
}

export function hasContentOsImport(): boolean {
  if (!canUseStorage()) return false;
  return (
    localStorage.getItem(CONTENT_OS_IMPORT_KEY) ===
    String(CONTENT_OS_IMPORT_VERSION)
  );
}

export function importContentOsSeed(): {
  addedIdeas: number;
  updatedProfile: boolean;
} {
  if (!canUseStorage()) return { addedIdeas: 0, updatedProfile: false };

  const existing = readIdeasRaw();
  // Limpia historial grabado del seed viejo (v1) para menos ruido
  const cleaned = existing.filter(
    (i) => !(i.notionKey && i.status === "recorded" && i.id.startsWith("cos-"))
  );
  // Repara seed ready sin draft (bug de importaciones previas)
  const repaired = cleaned.map((i) => {
    if (
      i.notionKey === "short-susanoo" &&
      (i.status === "ready" || i.status === "recorded") &&
      !i.draft
    ) {
      return { ...i, status: "captured" as const };
    }
    return i;
  });
  const byNotion = new Set(
    repaired.map((i) => i.notionKey).filter(Boolean) as string[]
  );
  const byId = new Set(repaired.map((i) => i.id));
  const seed = buildSeedIdeas();
  const toAdd = seed.filter(
    (i) => !(i.notionKey && byNotion.has(i.notionKey)) && !byId.has(i.id)
  );
  saveIdeas([...toAdd, ...repaired]);

  const profile = getProfile();
  const afs = SEED_GAMES.find((g) => g.id === "anime-fighting-simulator")!;
  const nextProfile = normalizeProfile({
    workspaceMode: "content_os",
    niches: profile?.niches?.length
      ? profile.niches
      : ["Gaming", "Roblox", "Guías", "Showcases", "Opiniones"],
    customDescription:
      profile?.customDescription?.trim() ||
      "Roblox en español — AFS primario, Shindo Life, Blox Lock. Comunidad Crimson Core.",
    onboardedAt: profile?.onboardedAt || new Date().toISOString(),
    useGameContext: true,
    activeGameId: profile?.activeGameId || "anime-fighting-simulator",
    gamesLibrary: SEED_GAMES.map((g) => g.brief),
    gameBrief: profile?.gameBrief?.latestUpdate?.trim()
      ? profile.gameBrief
      : afs.brief,
    recordingStyle: profile?.recordingStyle,
    brand: {
      ...DEFAULT_BRAND,
      ...profile?.brand,
      // Solo rellena brand kit si el usuario no lo personalizó
      creatorName:
        profile?.brand?.creatorName?.trim() || BRAND_KIT.creatorName,
      community: profile?.brand?.community?.trim() || BRAND_KIT.community,
      kick: profile?.brand?.kick?.trim() || BRAND_KIT.kick,
    },
    provenHooks: profile?.provenHooks?.length
      ? profile.provenHooks
      : PROVEN_HOOKS,
    youtube: profile?.youtube ?? null,
    youtubeCache: profile?.youtubeCache ?? null,
  });
  saveProfile(nextProfile);
  localStorage.setItem(
    CONTENT_OS_IMPORT_KEY,
    String(CONTENT_OS_IMPORT_VERSION)
  );

  return { addedIdeas: toAdd.length, updatedProfile: true };
}

const YT_CACHE_MS = 60 * 60 * 1000;
const YT_EMPTY_CACHE_MS = 5 * 60 * 1000;

export function youtubeCacheFresh(profile: CreatorProfile | null): boolean {
  const cache = profile?.youtubeCache;
  const at = cache?.fetchedAt;
  if (!at) return false;
  const age = Date.now() - new Date(at).getTime();
  if (!cache?.videos?.length) return age < YT_EMPTY_CACHE_MS;
  // Cache viejo sin stats → forzar refresh una vez
  const missingStats = cache.videos.some((v) => v.viewCount == null);
  if (missingStats) return false;
  return age < YT_CACHE_MS;
}
