import type { BillingSnapshot } from "@/lib/billing/plans";
import {
  bumpLocalUsage,
  notifyUsageChanged,
  syncLocalUsageFromServer,
} from "@/lib/local-usage";
import { getSupabaseBrowser } from "@/lib/supabase/client";

async function resolveUserId(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Aplica el billing de una respuesta de generación al medidor del usuario. */
export async function applyGenerationBilling(
  billing: BillingSnapshot | null | undefined
) {
  if (typeof window === "undefined") return;
  const userId = await resolveUserId();

  if (userId) {
    if (billing) {
      syncLocalUsageFromServer(userId, billing.used, billing.month);
    } else {
      bumpLocalUsage(userId);
    }
  }

  notifyUsageChanged(billing ?? null);
}

