"use client";

import { Suspense } from "react";
import PricingInner from "./PricingInner";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="lp">
          <p className="muted" style={{ padding: 24 }}>
            Cargando precios…
          </p>
        </div>
      }
    >
      <PricingInner />
    </Suspense>
  );
}
