"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  DictationButton,
  appendDictation,
} from "@/components/DictationButton";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { createId } from "@/lib/id";
import { isThinLongIdeaText } from "@/lib/long-generation";
import { trackFunnel } from "@/lib/metrics";
import { getProfile, upsertIdea } from "@/lib/storage";
import { NICHE_CHIPS, type Idea, type VideoMode } from "@/lib/types";

function CaptureForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("default");
  const [nicheOptions, setNicheOptions] = useState<string[]>([...NICHE_CHIPS]);
  const [saving, setSaving] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [thinWarn, setThinWarn] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    const niches = getProfile()?.niches?.filter(Boolean) || [];
    if (niches.length > 0) {
      setNicheOptions(niches);
      setCategory(niches[0]);
    } else {
      setNicheOptions([...NICHE_CHIPS]);
      setCategory("Gaming");
    }
  }, []);

  const onTranscript = useCallback((transcript: string) => {
    setText((prev) => appendDictation(prev, transcript));
  }, []);

  function openModePicker() {
    const trimmed = text.trim();
    if (!trimmed || savingRef.current) return;
    setThinWarn(false);
    setModeOpen(true);
  }

  function closeModePicker() {
    if (savingRef.current) return;
    setModeOpen(false);
    setThinWarn(false);
  }

  function saveWithMode(videoMode: VideoMode, { forceThin = false } = {}) {
    const trimmed = text.trim();
    if (!trimmed || savingRef.current) return;

    if (videoMode === "long" && isThinLongIdeaText(trimmed) && !forceThin) {
      setThinWarn(true);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setModeOpen(false);
    const now = new Date().toISOString();
    const idea: Idea = {
      id: createId("idea"),
      rawText: trimmed,
      category: category || "default",
      status: "captured",
      videoMode,
      createdAt: now,
      updatedAt: now,
    };
    upsertIdea(idea);
    trackFunnel("idea_captured");
    router.push(`/ideas/${idea.id}/directions`);
  }

  return (
    <AppShell title="Nueva idea" backHref="/">
      <p className="muted">
        Anota la idea de tu próximo video. Luego eliges si es corto o YouTube
        largo, el enfoque, y armamos la guía para grabar.
      </p>

      <p className="field-label">Categoría</p>
      <div className="chip-grid" role="group" aria-label="Categoría del video">
        {nicheOptions.map((niche) => {
          const active = category === niche;
          return (
            <button
              key={niche}
              type="button"
              className={`chip ${active ? "chip-active" : ""}`}
              aria-pressed={active}
              onClick={() => setCategory(niche)}
            >
              {niche}
            </button>
          );
        })}
      </div>

      <div className="field-with-mic">
        <textarea
          id="idea"
          className="field field-lg"
          rows={5}
          placeholder="¿De qué va el video?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              openModePicker();
            }
          }}
          autoFocus
          aria-label="Idea del nuevo video"
        />
        <DictationButton onTranscript={onTranscript} disabled={saving} />
      </div>

      <button
        type="button"
        className="btn-primary btn-block"
        disabled={!text.trim() || saving}
        onClick={openModePicker}
      >
        {saving ? "Guardando…" : "Crear idea"}
      </button>

      {modeOpen ? (
        <div
          className="mode-picker-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-picker-title"
          onClick={closeModePicker}
        >
          <div
            className="mode-picker-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="mode-picker-title" className="section-title">
              ¿Qué tipo de video?
            </h2>
            <p className="muted">
              Elige el formato. Sigues en esta misma pantalla hasta decidir.
            </p>

            <div className="mode-picker-choices">
              <button
                type="button"
                className="mode-choice"
                disabled={saving}
                onClick={() => saveWithMode("short")}
              >
                <span className="mode-choice-title">Video corto</span>
                <span className="mode-choice-desc">
                  TikTok, Shorts, Reels — ~30 s a 2 min 30 s. Idea breve y
                  concreta.
                </span>
              </button>

              <button
                type="button"
                className="mode-choice"
                disabled={saving}
                onClick={() => saveWithMode("long")}
              >
                <span className="mode-choice-title">YouTube largo</span>
                <span className="mode-choice-desc">
                  3–30 min. Ideal si ya tienes temas a cubrir y un orden
                  aproximado; la guía sale en bloques para grabar y editar.
                </span>
              </button>
            </div>

            {thinWarn ? (
              <div className="error-box" role="alert">
                <p className="error">
                  Para YouTube largo conviene una idea más desarrollada: qué
                  temas cubres, en qué orden y qué se lleva el viewer.
                </p>
                <button
                  type="button"
                  className="btn-secondary btn-block"
                  disabled={saving}
                  onClick={() => saveWithMode("long", { forceThin: true })}
                >
                  Continuar igual
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={saving}
                  onClick={() => {
                    setThinWarn(false);
                    setModeOpen(false);
                  }}
                >
                  Seguir editando la idea
                </button>
              </div>
            ) : null}

            <button
              type="button"
              className="text-link"
              disabled={saving}
              onClick={closeModePicker}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function CapturePage() {
  return (
    <RequireOnboarding>
      <CaptureForm />
    </RequireOnboarding>
  );
}
