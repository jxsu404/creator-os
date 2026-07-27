"use client";

import Link from "next/link";

/** Mensaje + CTA cuando Free se queda sin generaciones (HTTP 402). */
export function UpgradePrompt({
  message,
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "upgrade-prompt upgrade-prompt-compact" : "upgrade-prompt"}>
      <p className="upgrade-prompt-title">Pasa a Ideazo Pro</p>
      <p className="upgrade-prompt-body">
        {message ||
          "Agotaste las generaciones free de este mes. Pro te da más capacidad para seguir creando."}
      </p>
      <Link
        href="/pricing"
        className="btn-primary btn-block"
        onClick={() => {
          void fetch("/api/metrics/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "upgrade_click" }),
          });
        }}
      >
        Ver planes
      </Link>
    </div>
  );
}

export function isUsageLimitPayload(data: unknown): data is {
  code?: string;
  upgrade?: boolean;
  error?: string;
} {
  if (!data || typeof data !== "object") return false;
  const d = data as { code?: string; upgrade?: boolean };
  return d.code === "usage_limit" || d.upgrade === true;
}
