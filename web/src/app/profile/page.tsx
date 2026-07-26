"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { NICHE_CHIPS } from "@/lib/types";
import { getProfile, saveProfile } from "@/lib/storage";

function ProfileForm() {
  const router = useRouter();
  const [niches, setNiches] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setNiches(profile.niches);
      setCustom(profile.customDescription);
    }
  }, []);

  function toggleNiche(niche: string) {
    setNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }

  function save() {
    if (niches.length === 0 && !custom.trim()) {
      setError("Elige al menos un chip o escribe de qué va tu contenido.");
      return;
    }
    const existing = getProfile();
    saveProfile({
      niches,
      customDescription: custom.trim(),
      onboardedAt: existing?.onboardedAt || new Date().toISOString(),
    });
    setError("");
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      router.push("/");
    }, 800);
  }

  return (
    <AppShell title="Mi contenido" backHref="/">
      <p className="lede tight">Puedes cambiar esto cuando quieras.</p>
      <p className="muted">
        Los cambios afectan futuras generaciones de enfoques y borradores.
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
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />

      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="success">Guardado.</p> : null}

      <button type="button" className="btn-primary btn-block" onClick={save}>
        Guardar
      </button>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <RequireOnboarding>
      <ProfileForm />
    </RequireOnboarding>
  );
}
