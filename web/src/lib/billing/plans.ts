/** Planes y límites de Ideazo (freemium). */

export type PlanId = "free" | "pro";

export const FREE_MONTHLY_GENERATIONS = 15;
/** Soft cap Pro: suficiente para publicar cada 3 días con margen. */
export const PRO_MONTHLY_GENERATIONS = 500;

export const PRO_PRICE_MONTHLY_USD = 14;
export const PRO_PRICE_YEARLY_USD = 119;

export function monthlyLimitFor(plan: PlanId): number {
  return plan === "pro" ? PRO_MONTHLY_GENERATIONS : FREE_MONTHLY_GENERATIONS;
}

export function currentUsageMonth(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export type BillingSnapshot = {
  plan: PlanId;
  status: string;
  used: number;
  limit: number;
  remaining: number;
  month: string;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
};
