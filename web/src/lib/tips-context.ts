import type { HomeTip } from "./home-copy";
import type { CreatorProfile, Idea } from "./types";

const MAX_YT = 8;
const MAX_RECORDED = 5;

export const HOME_TIPS_CACHE_KEY = "creatoros_home_tips_v1";
export const HOME_TIPS_TTL_MS = 24 * 60 * 60 * 1000;

export type HomeTipsCache = {
  fingerprint: string;
  generatedAt: string;
  tips: HomeTip[];
};

export type TipsContextResult = {
  /** Texto para el prompt de IA (vacío si no hay videos recientes). */
  recentContent: string;
  /** Hash ligero para invalidar el cache. */
  fingerprint: string;
  /** True si hay YouTube y/o Grabadas que personalizan de verdad. */
  hasRecentSignal: boolean;
};

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function recordedLabel(idea: Idea): string {
  const title = idea.title?.trim() || idea.rawText.trim().slice(0, 80);
  const hook = idea.draft?.hook?.trim();
  if (hook) return `${title} | hook: ${hook}`;
  return title;
}

/**
 * Arma el contexto de videos recientes (YouTube + ideas Grabadas)
 * y un fingerprint estable para cache de consejos personalizados.
 */
export function buildTipsContext(
  profile: CreatorProfile | null,
  ideas: Idea[]
): TipsContextResult {
  const niches = (profile?.niches || []).map((n) => n.trim()).filter(Boolean);
  const description = (profile?.customDescription || "").trim();

  const ytVideos = (profile?.youtubeCache?.videos || []).slice(0, MAX_YT);
  const recorded = ideas
    .filter((i) => i.status === "recorded")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, MAX_RECORDED);

  const parts: string[] = [];

  if (ytVideos.length) {
    parts.push("Últimos videos de YouTube:");
    for (const v of ytVideos) {
      const date = v.publishedAt
        ? new Date(v.publishedAt).toLocaleDateString("es")
        : "?";
      const views =
        v.viewCount != null ? `, ${v.viewCount} vistas` : "";
      parts.push(`- ${v.title} (${date}${views})`);
    }
  }

  if (recorded.length) {
    parts.push("Ideas marcadas como Grabadas en Ideazo:");
    for (const idea of recorded) {
      parts.push(`- ${recordedLabel(idea)}`);
    }
  }

  const fingerprintPayload = [
    niches.join("|"),
    description,
    ytVideos.map((v) => `${v.id}:${v.title}`).join("|"),
    recorded.map((i) => `${i.id}:${i.title || i.rawText.slice(0, 40)}`).join("|"),
  ].join("::");

  return {
    recentContent: parts.join("\n"),
    fingerprint: simpleHash(fingerprintPayload),
    hasRecentSignal: ytVideos.length > 0 || recorded.length > 0,
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readHomeTipsCache(): HomeTipsCache | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(HOME_TIPS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeTipsCache;
    if (
      !parsed?.fingerprint ||
      !parsed?.generatedAt ||
      !Array.isArray(parsed.tips) ||
      parsed.tips.length < 3
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeHomeTipsCache(cache: HomeTipsCache): void {
  if (!canUseStorage()) return;
  localStorage.setItem(HOME_TIPS_CACHE_KEY, JSON.stringify(cache));
}

export function isHomeTipsCacheFresh(
  cache: HomeTipsCache,
  fingerprint: string,
  now = Date.now()
): boolean {
  if (cache.fingerprint !== fingerprint) return false;
  const generated = new Date(cache.generatedAt).getTime();
  if (!Number.isFinite(generated)) return false;
  return now - generated < HOME_TIPS_TTL_MS;
}

/** Normaliza tips de la API a HomeTip válidos (mín. 3). */
export function normalizeTips(raw: unknown): HomeTip[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      const tip = t as { title?: unknown; body?: unknown };
      return {
        title: String(tip?.title || "").trim(),
        body: String(tip?.body || "").trim(),
      };
    })
    .filter((t) => t.title && t.body)
    .slice(0, 3);
}
