import {
  currentUsageMonth,
  FREE_MONTHLY_GENERATIONS,
  type BillingSnapshot,
} from "@/lib/billing/plans";

const STORAGE_PREFIX = "ideazo_usage_v1:";

type LocalUsage = {
  month: string;
  count: number;
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function read(userId: string): LocalUsage {
  const month = currentUsageMonth();
  if (typeof window === "undefined") return { month, count: 0 };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { month, count: 0 };
    const parsed = JSON.parse(raw) as LocalUsage;
    if (!parsed || parsed.month !== month) return { month, count: 0 };
    return {
      month,
      count: Math.max(0, Number(parsed.count) || 0),
    };
  } catch {
    return { month, count: 0 };
  }
}

function write(userId: string, usage: LocalUsage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(usage));
  } catch {
    /* ignore quota */
  }
}

/** Sube el contador local del usuario (1 generación). */
export function bumpLocalUsage(userId: string): LocalUsage {
  const cur = read(userId);
  const next = { month: currentUsageMonth(), count: cur.count + 1 };
  write(userId, next);
  return next;
}

/** Alinea el contador local al servidor si el servidor va más adelante. */
export function syncLocalUsageFromServer(
  userId: string,
  serverUsed: number,
  month?: string
) {
  const m = month || currentUsageMonth();
  const cur = read(userId);
  const count =
    cur.month === m ? Math.max(cur.count, serverUsed) : Math.max(0, serverUsed);
  write(userId, { month: m, count });
}

export function getLocalUsageCount(userId: string): number {
  return read(userId).count;
}

/**
 * Snapshot de UI: prioriza servidor, pero no deja el medidor en 0 si
 * el cliente ya registró generaciones este mes (schema/RPC fallando).
 */
export function mergeUsageForDisplay(
  userId: string | null | undefined,
  server: BillingSnapshot | null,
  limitFallback = FREE_MONTHLY_GENERATIONS
): BillingSnapshot | null {
  if (!userId && !server) return null;
  const month = server?.month || currentUsageMonth();
  const local = userId ? read(userId).count : 0;
  const used = Math.max(server?.used ?? 0, local);
  const limit = server?.limit || limitFallback;
  return {
    plan: server?.plan || "free",
    status: server?.status || "active",
    used,
    limit,
    remaining: Math.max(0, limit - used),
    month,
    stripeCustomerId: server?.stripeCustomerId ?? null,
    currentPeriodEnd: server?.currentPeriodEnd ?? null,
  };
}

export const USAGE_EVENT = "ideazo:usage";

export function notifyUsageChanged(detail?: BillingSnapshot | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(USAGE_EVENT, { detail: detail ?? null }));
}
