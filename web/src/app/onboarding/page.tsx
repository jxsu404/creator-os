"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NICHE_CHIPS } from "@/lib/types";
import { getProfile, saveProfile } from "@/lib/storage";

export default function OnboardingPage() {
  const router = useRouter();
  const [niches, setNiches] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = getProfile();
    if (existing) {
      setNiches(existing.niches);
      setCustom(existing.customDescription);
    }
  }, []);

  function toggleNiche(niche: string) {
    setNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }

  function continueOnboarding() {
    if (niches.length === 0 && !custom.trim()) {
      setError("Elige al menos un chip o escribe de qué va tu contenido.");
      return;
    }
    saveProfile({
      niches,
      customDescription: custom.trim(),
      onboardedAt: new Date().toISOString(),
    });
    router.push("/");
  }

  return (
    <div className="app-shell">
      <main className="app-main onboarding">
        <p className="eyebrow">Creator OS</p>
        <h1 className="hero-title">¿De qué va tu contenido?</h1>
        <p className="lede">
          Así los enfoques y guiones se acercan a tu estilo — no a un genérico.
        </p>

        <div className="chip-grid">
          {NICHE_CHIPS.map((niche) => {
            const active = niches.includes(niche);
            return (
              <button
                key={niche}
                type="button"
                className={`chip ${active ? "chip-active" : ""}`}
                onClick={() => toggleNiche(niche)}
              >
                {niche}
              </button>
            );
          })}
        </div>

        <label className="field-label" htmlFor="custom">
          Otro / más detalle
        </label>
        <textarea
          id="custom"
          className="field"
          rows={3}
          placeholder="Ej. Roblox — guías y showcases de Anime Fighting Simulator"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />

        {error ? <p className="error">{error}</p> : null}

        <button type="button" className="btn-primary" onClick={continueOnboarding}>
          Continuar
        </button>
      </main>
    </div>
  );
}
