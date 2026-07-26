"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { getIdea, upsertIdea } from "@/lib/storage";
import type { Beat, Idea } from "@/lib/types";

function DraftEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    const found = getIdea(id);
    if (!found?.draft) {
      router.replace(`/ideas/${id}`);
      return;
    }
    setIdea(found);
  }, [id, router]);

  if (!idea?.draft) {
    return (
      <AppShell backHref="/">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  function persist(next: Idea, message?: string) {
    upsertIdea(next);
    setIdea(next);
    if (message) {
      setSavedMsg(message);
      window.setTimeout(() => setSavedMsg(""), 2500);
    }
  }

  function updateDraft(partial: Partial<Idea["draft"]>) {
    const now = new Date().toISOString();
    persist({
      ...idea!,
      draft: {
        ...idea!.draft!,
        ...partial,
        updatedAt: now,
      },
      updatedAt: now,
      status: idea!.status === "ready" ? "in_progress" : idea!.status,
    });
  }

  function updateBeat(index: number, beat: Beat) {
    const beats = [...idea!.draft!.beats];
    beats[index] = beat;
    updateDraft({ beats });
  }

  function markReady() {
    const now = new Date().toISOString();
    const next: Idea = {
      ...idea!,
      status: "ready",
      updatedAt: now,
    };
    upsertIdea(next);
    setIdea(next);
    router.push("/");
  }

  const { draft } = idea;
  const showScript = draft.format === "script" || draft.format === "both";
  const showBeats = draft.format === "beats" || draft.format === "both";

  return (
    <AppShell title="Borrador" backHref={`/ideas/${id}`}>
      <p className="muted">
        Formato:{" "}
        {draft.format === "script"
          ? "Guion"
          : draft.format === "beats"
            ? "Guía para grabar"
            : "Guion + guía"}{" "}
        · ~{draft.estimatedSeconds}s
      </p>

      {savedMsg ? <p className="success">{savedMsg}</p> : null}

      <label className="field-label" htmlFor="hook">
        Hook
      </label>
      <textarea
        id="hook"
        className="field"
        rows={2}
        value={draft.hook}
        onChange={(e) => updateDraft({ hook: e.target.value })}
      />

      {showScript ? (
        <>
          <label className="field-label" htmlFor="body">
            Guion
          </label>
          <textarea
            id="body"
            className="field field-lg"
            rows={8}
            value={draft.scriptBody}
            onChange={(e) => updateDraft({ scriptBody: e.target.value })}
          />
          <label className="field-label" htmlFor="closing">
            Cierre
          </label>
          <textarea
            id="closing"
            className="field"
            rows={2}
            value={draft.closing}
            onChange={(e) => updateDraft({ closing: e.target.value })}
          />
        </>
      ) : null}

      {showBeats ? (
        <section className="section">
          <h2 className="section-title">Beats</h2>
          <div className="stack">
            {draft.beats.map((beat, index) => (
              <div key={index} className="beat-card">
                <p className="meta-label">Beat {index + 1}</p>
                <label className="field-label">Qué decir</label>
                <textarea
                  className="field"
                  rows={2}
                  value={beat.say}
                  onChange={(e) =>
                    updateBeat(index, { ...beat, say: e.target.value })
                  }
                />
                <label className="field-label">Qué mostrar</label>
                <textarea
                  className="field"
                  rows={2}
                  value={beat.show}
                  onChange={(e) =>
                    updateBeat(index, { ...beat, show: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <button type="button" className="btn-primary btn-block" onClick={markReady}>
        Marcar lista para grabar
      </button>

      <Link href={`/ideas/${id}/directions`} className="btn-secondary btn-block">
        Cambiar enfoque
      </Link>
    </AppShell>
  );
}

export default function DraftPage() {
  return (
    <RequireOnboarding>
      <DraftEditor />
    </RequireOnboarding>
  );
}
