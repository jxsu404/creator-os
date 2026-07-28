/** Fire-and-forget funnel event (soft launch metrics). */
export function trackFunnel(
  event:
    | "signup"
    | "onboarding_complete"
    | "idea_captured"
    | "directions_generated"
    | "draft_ready"
    | "marked_ready"
    | "hit_limit"
    | "donate_click",
  meta?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  void fetch("/api/metrics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, meta: meta || {} }),
  }).catch(() => {
    /* ignore */
  });
}
