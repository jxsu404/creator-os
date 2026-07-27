"use client";

import Link from "next/link";
import { paypalDonateUrl, SUPPORT_PATH } from "@/lib/donations";

function trackDonateClick() {
  void fetch("/api/metrics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "donate_click", meta: { source: "limit" } }),
  });
}

/** Mensaje + CTA cuando Free se queda sin generaciones (HTTP 402). */
export function UpgradePrompt({
  message,
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  const donateUrl = paypalDonateUrl();
  const href = donateUrl || SUPPORT_PATH;
  const external = Boolean(donateUrl);

  return (
    <div className={compact ? "upgrade-prompt upgrade-prompt-compact" : "upgrade-prompt"}>
      <p className="upgrade-prompt-title">Cupo free del mes</p>
      <p className="upgrade-prompt-body">
        {message ||
          "Agotaste las generaciones free de este mes. Si Ideazo te está sirviendo, puedes apoyar el proyecto con una donación voluntaria."}
      </p>
      {external ? (
        <a
          href={href}
          className="btn-primary btn-block"
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackDonateClick}
        >
          Donar con PayPal
        </a>
      ) : (
        <Link
          href={href}
          className="btn-primary btn-block"
          onClick={trackDonateClick}
        >
          Cómo apoyar
        </Link>
      )}
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
