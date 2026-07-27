import fs from "fs";
import path from "path";

export type AiCooldownReason =
  | "rate_limit"
  | "daily_quota"
  | "invalid_key"
  | "error";

export type AiCooldownEntry = {
  id: string;
  label: string;
  until: string;
  reason: AiCooldownReason;
  detail?: string;
};

export type AiProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
  available: boolean;
  cooldownUntil: string | null;
  reason: AiCooldownReason | null;
  detail: string | null;
  remainingMs: number;
  remainingLabel: string | null;
};

type Store = { entries: Record<string, AiCooldownEntry> };

const STORE_PATH = path.join(process.cwd(), ".data", "ai-cooldowns.json");

function readStore(): Store {
  try {
    if (!fs.existsSync(STORE_PATH)) return { entries: {} };
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return parsed?.entries ? parsed : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

function writeStore(store: Store): void {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.warn("[ai-cooldown] no pude persistir:", err);
  }
}

function prune(store: Store): Store {
  const now = Date.now();
  const next: Store = { entries: {} };
  for (const [id, entry] of Object.entries(store.entries)) {
    if (new Date(entry.until).getTime() > now) next.entries[id] = entry;
  }
  return next;
}

export function getCooldown(id: string): AiCooldownEntry | null {
  const store = prune(readStore());
  if (Object.keys(store.entries).length !== Object.keys(readStore().entries).length) {
    writeStore(store);
  }
  return store.entries[id] ?? null;
}

export function isInCooldown(id: string): boolean {
  return Boolean(getCooldown(id));
}

export function clearCooldown(id: string): void {
  const store = readStore();
  if (!store.entries[id]) return;
  delete store.entries[id];
  writeStore(prune(store));
}

export function setCooldown(entry: AiCooldownEntry): void {
  const store = prune(readStore());
  store.entries[entry.id] = entry;
  writeStore(store);
}

/** Próxima medianoche America/Los_Angeles (reset free tier Gemini). */
export function nextPacificMidnightIso(from = new Date()): string {
  const dayFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startDay = dayFmt.format(from);
  let t = from.getTime();
  while (dayFmt.format(new Date(t)) === startDay) {
    t += 10 * 60 * 1000;
  }
  const nextDay = dayFmt.format(new Date(t));
  let lo = t - 26 * 60 * 60 * 1000;
  let hi = t;
  while (hi - lo > 500) {
    const mid = Math.floor((lo + hi) / 2);
    if (dayFmt.format(new Date(mid)) === nextDay) hi = mid;
    else lo = mid;
  }
  return new Date(hi).toISOString();
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "ya disponible";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Extrae cooldown del error. null si no es cuota/key inválida.
 */
export function cooldownMsFromError(err: unknown): {
  ms: number;
  reason: AiCooldownReason;
  detail: string;
} | null {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  const isInvalid =
    lower.includes("api_key_invalid") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    (lower.includes("401") && lower.includes("key")) ||
    (lower.includes("400") &&
      lower.includes("key") &&
      lower.includes("invalid"));

  if (isInvalid) {
    const until = nextPacificMidnightIso();
    return {
      ms: Math.max(60_000, new Date(until).getTime() - Date.now()),
      reason: "invalid_key",
      detail: "API key inválida",
    };
  }

  const isQuota =
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("limit: 0") ||
    lower.includes("too many requests");

  if (!isQuota) return null;

  const retryAfterHeader = raw.match(/retry-after["\s:=]+(\d+(?:\.\d+)?)/i);
  const retryIn = raw.match(/retry in\s+(\d+(?:\.\d+)?)\s*s/i);
  const seconds = Number(retryAfterHeader?.[1] || retryIn?.[1]);

  if (Number.isFinite(seconds) && seconds > 0) {
    return {
      ms: Math.ceil(seconds * 1000) + 2000,
      reason: "rate_limit",
      detail: `Rate limit · ~${Math.ceil(seconds)}s`,
    };
  }

  if (
    lower.includes("per day") ||
    lower.includes("daily") ||
    lower.includes("rpd") ||
    lower.includes("limit: 0") ||
    lower.includes("free_tier") ||
    lower.includes("exceeded your current quota")
  ) {
    const until = nextPacificMidnightIso();
    return {
      ms: Math.max(60_000, new Date(until).getTime() - Date.now()),
      reason: "daily_quota",
      detail: "Cuota diaria · reset medianoche (Pacífico)",
    };
  }

  return {
    ms: 60_000,
    reason: "rate_limit",
    detail: "Cuota/rate limit · pausa 1 min",
  };
}

export function statusFromCooldown(
  id: string,
  label: string,
  configured: boolean,
  entry: AiCooldownEntry | null
): AiProviderStatus {
  const now = Date.now();
  const remainingMs = entry
    ? Math.max(0, new Date(entry.until).getTime() - now)
    : 0;
  return {
    id,
    label,
    configured,
    available: configured && remainingMs <= 0,
    cooldownUntil: remainingMs > 0 && entry ? entry.until : null,
    reason: remainingMs > 0 && entry ? entry.reason : null,
    detail: remainingMs > 0 && entry ? entry.detail || null : null,
    remainingMs,
    remainingLabel: remainingMs > 0 ? formatRemaining(remainingMs) : null,
  };
}
