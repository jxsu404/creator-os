"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/components/AuthProvider";
import {
  FREE_MONTHLY_GENERATIONS,
  PRO_MONTHLY_GENERATIONS,
  PRO_PRICE_MONTHLY_USD,
  PRO_PRICE_YEARLY_USD,
  type BillingSnapshot,
} from "@/lib/billing/plans";

type StatusResponse = {
  stripeReady: boolean;
  billing: BillingSnapshot | null;
};

export default function PricingInner() {
  const { user, loading } = useAuth();
  const params = useSearchParams();
  const [busy, setBusy] = useState<"month" | "year" | "portal" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const checkout = params.get("checkout");

  useEffect(() => {
    void fetch("/api/billing/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: StatusResponse) => setStatus(data))
      .catch(() => setStatus(null));

    if (checkout === "success") {
      void fetch("/api/metrics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "checkout_success" }),
      });
    }
  }, [checkout]);

  async function startCheckout(interval: "month" | "year") {
    setError("");
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent("/pricing")}`;
      return;
    }
    setBusy(interval);
    try {
      void fetch("/api/metrics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "checkout_started",
          meta: { interval },
        }),
      });
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout falló");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude abrir Stripe.");
      setBusy(null);
    }
  }

  async function openPortal(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portal falló");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude abrir el portal.");
      setBusy(null);
    }
  }

  const isPro = status?.billing?.plan === "pro";

  return (
    <div className="lp lp-pricing-page">
      <div className="lp-atmosphere" aria-hidden />
      <header className="lp-nav">
        <BrandMark href="/" />
        <Link href={user ? "/" : "/login"} className="lp-nav-link">
          {user ? "App" : "Entrar"}
        </Link>
      </header>

      <main className="pricing-main">
        <h1 className="pricing-title">Planes Ideazo</h1>
        <p className="pricing-sub">
          Free para probar el loop. Pro para publicar sin quedarte sin cupo.
        </p>

        {checkout === "success" ? (
          <p className="success-banner">Suscripción activada. Gracias.</p>
        ) : null}
        {checkout === "cancel" ? (
          <p className="muted">
            Checkout cancelado. Puedes intentarlo cuando quieras.
          </p>
        ) : null}

        <div className="lp-pricing">
          <div className="lp-price-card">
            <p className="lp-price-name">Free</p>
            <p className="lp-price-amount">
              $0<span>/mes</span>
            </p>
            <ul className="lp-price-list">
              <li>{FREE_MONTHLY_GENERATIONS} generaciones IA / mes</li>
              <li>Idea → 3 enfoques → guía</li>
              <li>Sync entre dispositivos</li>
            </ul>
            {!isPro ? (
              <p className="lp-price-current">Tu plan actual</p>
            ) : (
              <Link href="/" className="lp-btn-ghost lp-price-cta">
                Seguir en la app
              </Link>
            )}
          </div>

          <div className="lp-price-card lp-price-card-pro">
            <p className="lp-price-name">Pro</p>
            <p className="lp-price-amount">
              ${PRO_PRICE_MONTHLY_USD}
              <span>/mes</span>
            </p>
            <ul className="lp-price-list">
              <li>{PRO_MONTHLY_GENERATIONS} generaciones / mes</li>
              <li>Prioridad de capacidad</li>
              <li>${PRO_PRICE_YEARLY_USD}/año (ahorro)</li>
            </ul>
            {isPro ? (
              <form onSubmit={openPortal}>
                <button
                  type="submit"
                  className="lp-btn-primary lp-price-cta"
                  disabled={busy === "portal" || loading}
                >
                  {busy === "portal" ? "Abriendo…" : "Gestionar suscripción"}
                </button>
              </form>
            ) : (
              <div className="pricing-actions">
                <button
                  type="button"
                  className="lp-btn-primary lp-price-cta"
                  disabled={busy !== null || loading}
                  onClick={() => void startCheckout("month")}
                >
                  {busy === "month"
                    ? "Abriendo…"
                    : `Pro mensual · $${PRO_PRICE_MONTHLY_USD}`}
                </button>
                <button
                  type="button"
                  className="lp-btn-ghost lp-price-cta"
                  disabled={busy !== null || loading}
                  onClick={() => void startCheckout("year")}
                >
                  {busy === "year"
                    ? "Abriendo…"
                    : `Pro anual · $${PRO_PRICE_YEARLY_USD}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {status?.billing ? (
          <p className="muted pricing-usage">
            Uso este mes: {status.billing.used}/{status.billing.limit} (
            {status.billing.plan})
          </p>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
        {!status?.stripeReady ? (
          <p className="muted">
            Stripe se activa con las keys en Vercel. Mientras tanto puedes usar
            Free en dogfooding.
          </p>
        ) : null}

        <p className="pricing-legal">
          Al suscribirte aceptas los <Link href="/terms">Términos</Link> y la{" "}
          <Link href="/privacy">Privacidad</Link>.
        </p>
      </main>
    </div>
  );
}
