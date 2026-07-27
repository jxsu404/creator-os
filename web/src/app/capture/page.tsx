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
import { ensureIdeaTitle } from "@/lib/idea-title";
import { getProfile, upsertIdea } from "@/lib/storage";
import { NICHE_CHIPS, type Idea } from "@/lib/types";

function CaptureForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("default");
  const [nicheOptions, setNicheOptions] = useState<string[]>([...NICHE_CHIPS]);
  const [saving, setSaving] = useState(false);
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

  function save() {
    const trimmed = text.trim();
    if (!trimmed || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const now = new Date().toISOString();
    const idea: Idea = {
      id: createId("idea"),
      rawText: trimmed,
      category: category || "default",
      status: "captured",
      createdAt: now,
      updatedAt: now,
    };
    upsertIdea(idea);
    void ensureIdeaTitle(idea);
    router.push(`/ideas/${idea.id}`);
  }

  return (
    <AppShell title="Nueva idea" backHref="/">
      <p className="muted">
        Anota la idea de tu próximo video. Luego eliges el enfoque y armamos la
        guía para grabar.
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
              save();
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
        onClick={save}
      >
        {saving ? "Guardando…" : "Crear idea"}
      </button>
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
