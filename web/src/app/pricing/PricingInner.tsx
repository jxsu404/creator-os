"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/components/AuthProvider";
import {
  FREE_MONTHLY_GENERATIONS,
  type BillingSnapshot,
} from "@/lib/billing/plans";
import { paypalDonateUrl } from "@/lib/donations";

type StatusResponse = {
  billing: BillingSnapshot | null;
};

function trackDonateClick(source: string) {
  void fetch("/api/metrics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "donate_click",
      meta: { source },
    }),
  });
}

export default function PricingInner() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const donateUrl = paypalDonateUrl();

  useEffect(() => {
    void fetch("/api/billing/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: StatusResponse) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

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
        <h1 className="pricing-title">Apoya Ideazo</h1>
        <p className="pricing-sub">
          Ideazo es gratis mientras construimos un buen producto. Si te gusta y
          quieres financiar el proyecto, puedes donar por PayPal — sin
          suscripción.
        </p>

        <div className="lp-pricing">
          <div className="lp-price-card">
            <p className="lp-price-name">Gratis</p>
            <p className="lp-price-amount">
              $0<span>/mes</span>
            </p>
            <ul className="lp-price-list">
              <li>{FREE_MONTHLY_GENERATIONS} generaciones IA / mes</li>
              <li>Idea → 3 enfoques → guía</li>
              <li>Sync entre dispositivos</li>
            </ul>
            <Link href={user ? "/" : "/login"} className="lp-btn-ghost lp-price-cta">
              {user ? "Seguir en la app" : "Empezar"}
            </Link>
          </div>

          <div className="lp-price-card lp-price-card-pro">
            <p className="lp-price-name">Donación</p>
            <p className="lp-price-amount">
              PayPal
            </p>
            <ul className="lp-price-list">
              <li>Voluntaria, del monto que quieras</li>
              <li>Ayuda a pagar IA y hosting</li>
              <li>No desbloquea un plan Pro (aún)</li>
            </ul>
            {donateUrl ? (
              <a
                href={donateUrl}
                className="lp-btn-primary lp-price-cta"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackDonateClick("pricing")}
              >
                Donar con PayPal
              </a>
            ) : (
              <p className="muted lp-price-cta">
                Pronto: link de PayPal. Mientras tanto, gracias por usar Ideazo.
              </p>
            )}
          </div>
        </div>

        {status?.billing ? (
          <p className="muted pricing-usage">
            Uso este mes: {status.billing.used}/{status.billing.limit}
          </p>
        ) : null}

        <p className="pricing-legal">
          Las donaciones son opcionales. Ver{" "}
          <Link href="/terms">Términos</Link> y{" "}
          <Link href="/privacy">Privacidad</Link>.
        </p>
      </main>
    </div>
  );
}
