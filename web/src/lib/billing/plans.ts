/** Planes y límites de Ideazo (free + cupo mensual). */

export type PlanId = "free" | "pro";

export const FREE_MONTHLY_GENERATIONS = 15;
/** Soft cap interno (asignación manual en DB). No hay suscripción. */
export const PRO_MONTHLY_GENERATIONS = 500;

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
};
