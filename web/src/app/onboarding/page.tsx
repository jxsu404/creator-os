"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireInvite } from "@/components/RequireInvite";
import { NICHE_CHIPS } from "@/lib/types";
import { trackFunnel } from "@/lib/metrics";
import { getProfile, saveProfile } from "@/lib/storage";

function OnboardingForm() {
  const router = useRouter();
  const [niches, setNiches] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = getProfile();
    if (existing?.onboardedAt) {
      router.replace("/");
      return;
    }
    if (existing) {
      setNiches(existing.niches || []);
      setCustom(existing.customDescription || "");
    }
    setReady(true);
  }, [router]);

  function toggleNiche(niche: string) {
    setNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }

  function continueOnboarding() {
    if (niches.length === 0 && !custom.trim()) {
      setError("Elige un chip o escribe algo.");
      return;
    }
    const existing = getProfile();
    const gaming = niches.some((n) => n.trim().toLowerCase() === "gaming");
    saveProfile({
      niches,
      customDescription: custom.trim(),
      onboardedAt: existing?.onboardedAt || new Date().toISOString(),
      workspaceMode: existing?.workspaceMode || "blank",
      useGameContext: gaming ? existing?.useGameContext !== false : false,
      ...(existing
        ? {
            activeGameId: existing.activeGameId,
            gamesLibrary: existing.gamesLibrary,
            gameBrief: existing.gameBrief,
            recordingStyle: existing.recordingStyle,
            brand: existing.brand,
            provenHooks: existing.provenHooks,
            youtube: existing.youtube,
            youtubeCache: existing.youtubeCache,
          }
        : {}),
    });
    void trackFunnel("onboarding_complete");
    router.push("/");
  }

  if (!ready) {
    return (
      <AppShell showNav={false}>
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <div className="onboarding">
        <p className="onboarding-kicker">Tu canal</p>
        <h1 className="hero-title">¿De qué va tu contenido?</h1>
        <p className="muted onboarding-lead">
          Elige nichos. Así las ideas y consejos hablan tu idioma.
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

        <textarea
          id="custom"
          className="field"
          rows={2}
          placeholder="Más detalle (opcional)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          aria-label="Más detalle"
        />

        {error ? <p className="error">{error}</p> : null}

        <button
          type="button"
          className="btn-primary btn-block"
          onClick={continueOnboarding}
        >
          Continuar
        </button>
      </div>
    </AppShell>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <RequireInvite>
        <OnboardingForm />
      </RequireInvite>
    </RequireAuth>
  );
}
