"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { createId } from "@/lib/id";
import { profileContext } from "@/lib/profile-context";
import { getIdea, getProfile, upsertIdea } from "@/lib/storage";
import type { Direction, DraftFormat, Idea } from "@/lib/types";

function DirectionsFlow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Direction | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [format, setFormat] = useState<DraftFormat>("beats");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const found = getIdea(id);
    if (!found) {
      router.replace("/");
      return;
    }
    setIdea(found);
    if (found.directions?.length) {
      // keep existing until regenerate
    }
  }, [id, router]);

  async function generateDirections(force = false) {
    if (!idea) return;
    if (idea.directions?.length && !force) return;
    setLoading(true);
    setError("");
    try {
      const profile = getProfile();
      const res = await fetch("/api/generate-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: idea.rawText,
          profileContext: profile ? profileContext(profile) : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const directions: Direction[] = data.directions.map(
        (d: Omit<Direction, "id">) => ({
          ...d,
          id: createId("dir"),
        })
      );
      const next = {
        ...idea,
        directions,
        updatedAt: new Date().toISOString(),
      };
      upsertIdea(next);
      setIdea(next);
      setSelected(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pude armar buenos enfoques. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (idea && !idea.directions?.length && !loading && !error) {
      void generateDirections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id]);

  async function createDraft() {
    if (!idea || !selected) return;
    setCreating(true);
    setError("");
    try {
      const profile = getProfile();
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: idea.rawText,
          profileContext: profile ? profileContext(profile) : "",
          direction: selected,
          adjustment,
          format,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const now = new Date().toISOString();
      const next: Idea = {
        ...idea,
        status: "in_progress",
        selectedDirectionId: selected.id,
        directionAdjustment: adjustment.trim() || undefined,
        directions: idea.directions,
        draft: {
          format,
          hook: data.draft.hook || "",
          scriptBody: data.draft.scriptBody || "",
          closing: data.draft.closing || "",
          beats: data.draft.beats || [],
          estimatedSeconds: data.draft.estimatedSeconds || 45,
          updatedAt: now,
        },
        updatedAt: now,
      };
      upsertIdea(next);
      router.push(`/ideas/${idea.id}/draft`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pude crear el borrador. Intenta de nuevo."
      );
    } finally {
      setCreating(false);
    }
  }

  if (!idea) {
    return (
      <AppShell backHref="/">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  if (selected) {
    return (
      <AppShell title="Personalizar" backHref={`/ideas/${id}/directions`}>
        <p className="muted">
          Enfoque: <strong>{selected.name}</strong>
        </p>
        <label className="field-label" htmlFor="adj">
          ¿Algún ajuste antes del borrador?
        </label>
        <textarea
          id="adj"
          className="field"
          rows={3}
          placeholder="Ej. más directo, menos técnico…"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
        />

        <p className="field-label">Formato</p>
        <div className="format-row">
          {(
            [
              ["beats", "Guía para grabar"],
              ["script", "Guion"],
              ["both", "Ambos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${format === value ? "chip-active" : ""}`}
              onClick={() => setFormat(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button
          type="button"
          className="btn-primary btn-block"
          disabled={creating}
          onClick={createDraft}
        >
          {creating ? "Creando borrador…" : "Crear borrador"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setSelected(null)}
        >
          Elegir otro enfoque
        </button>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tres enfoques" backHref={`/ideas/${id}`}>
      <p className="lede tight">
        Elige el que más suene a lo que quieres grabar.
      </p>

      {loading ? <p className="muted">Armando enfoques…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="stack">
        {idea.directions?.map((dir) => (
          <article key={dir.id} className="direction-card">
            <h2 className="direction-name">{dir.name}</h2>
            <p>
              <span className="meta-label">Promesa</span> {dir.promise}
            </p>
            <p>
              <span className="meta-label">Ángulo</span> {dir.angle}
            </p>
            <p>
              <span className="meta-label">Hook</span> {dir.hook}
            </p>
            <p className="muted">{dir.why}</p>
            <button
              type="button"
              className="btn-primary btn-block"
              onClick={() => setSelected(dir)}
            >
              Usar este enfoque
            </button>
          </article>
        ))}
      </div>

      {!loading ? (
        <button
          type="button"
          className="btn-secondary btn-block"
          onClick={() => generateDirections(true)}
        >
          Probar otros enfoques
        </button>
      ) : null}
    </AppShell>
  );
}

export default function DirectionsPage() {
  return (
    <RequireOnboarding>
      <DirectionsFlow />
    </RequireOnboarding>
  );
}
