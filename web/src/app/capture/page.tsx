"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  DictationButton,
  appendDictation,
} from "@/components/DictationButton";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { createId } from "@/lib/id";
import { ensureIdeaTitle } from "@/lib/idea-title";
import { upsertIdea } from "@/lib/storage";
import type { Idea } from "@/lib/types";

function CaptureForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

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
      <textarea
        id="idea"
        className="field field-lg"
        rows={5}
        placeholder="¿De qué va el video? Escribe o dicta la idea…"
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
