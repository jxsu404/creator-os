import type { SupabaseClient } from "@supabase/supabase-js";
import {
  currentUsageMonth,
  monthlyLimitFor,
  type BillingSnapshot,
  type PlanId,
} from "@/lib/billing/plans";

export class UsageLimitError extends Error {
  readonly code = "usage_limit";
  readonly status = 402;
  readonly snapshot: BillingSnapshot;

  constructor(snapshot: BillingSnapshot) {
    super(
      snapshot.plan === "pro"
        ? "Llegaste al límite suave de Ideazo Pro este mes. Escríbenos si necesitas más."
        : "Agotaste las generaciones free de este mes. Pasa a Ideazo Pro para seguir."
    );
    this.name = "UsageLimitError";
    this.snapshot = snapshot;
  }
}

type SubRow = {
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  current_period_end: string | null;
};

function asPlan(raw: string | null | undefined): PlanId {
  return raw === "pro" ? "pro" : "free";
}

export async function getBillingSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingSnapshot> {
  const month = currentUsageMonth();
  const emptyFree = (): BillingSnapshot => ({
    plan: "free",
    status: "active",
    used: 0,
    limit: monthlyLimitFor("free"),
    remaining: monthlyLimitFor("free"),
    month,
    stripeCustomerId: null,
    currentPeriodEnd: null,
  });

  try {
    const [{ data: sub, error: subErr }, { data: usage, error: usageErr }] =
      await Promise.all([
        supabase
          .from("billing_subscriptions")
          .select("plan, status, stripe_customer_id, current_period_end")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("usage_monthly")
          .select("generations_count")
          .eq("user_id", userId)
          .eq("month", month)
          .maybeSingle(),
      ]);

    if (subErr) console.warn("[billing] subscriptions read", subErr.message);
    if (usageErr) console.warn("[billing] usage read", usageErr.message);

    const row = sub as SubRow | null;
    const plan = asPlan(row?.plan);
    const status = row?.status || "active";
    const effectivePlan: PlanId =
      plan === "pro" && (status === "active" || status === "trialing")
        ? "pro"
        : "free";
    const used = Number(
      (usage as { generations_count?: number } | null)?.generations_count || 0
    );
    const limit = monthlyLimitFor(effectivePlan);

    return {
      plan: effectivePlan,
      status,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      month,
      stripeCustomerId: row?.stripe_customer_id ?? null,
      currentPeriodEnd: row?.current_period_end ?? null,
    };
  } catch (err) {
    console.warn("[billing] snapshot failed; defaulting to free", err);
    return emptyFree();
  }
}

/**
 * Reserva 1 generación si hay cupo.
 * Sin tablas / sin auth cloud: no-op (modo local dogfood).
 */
export async function consumeGeneration(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingSnapshot> {
  const before = await getBillingSnapshot(supabase, userId);
  if (before.used >= before.limit) {
    throw new UsageLimitError(before);
  }

  const { error } = await supabase.rpc("increment_ai_generation", {
    p_month: before.month,
  });

  if (error) {
    // Fallback si el RPC aún no está migrado: upsert manual (menos atómico).
    const nextCount = before.used + 1;
    const { error: upsertErr } = await supabase.from("usage_monthly").upsert(
      {
        user_id: userId,
        month: before.month,
        generations_count: nextCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,month" }
    );
    if (upsertErr) {
      console.error("[billing] increment failed", error, upsertErr);
      // Fail open en dogfood si el schema no está: no bloquear al fundador.
      return before;
    }
    return {
      ...before,
      used: nextCount,
      remaining: Math.max(0, before.limit - nextCount),
    };
  }

  return {
    ...before,
    used: before.used + 1,
    remaining: Math.max(0, before.limit - (before.used + 1)),
  };
}

export function usageLimitResponse(err: UsageLimitError) {
  return {
    error: err.message,
    code: err.code,
    upgrade: err.snapshot.plan === "free",
    billing: err.snapshot,
  };
}
