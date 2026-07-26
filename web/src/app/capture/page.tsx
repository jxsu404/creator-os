"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { createId } from "@/lib/id";
import { upsertIdea } from "@/lib/storage";
import type { Idea } from "@/lib/types";

function CaptureForm() {
  const router = useRouter();
  const [text, setText] = useState("");

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const idea: Idea = {
      id: createId("idea"),
      rawText: trimmed,
      status: "captured",
      createdAt: now,
      updatedAt: now,
    };
    upsertIdea(idea);
    router.push(`/ideas/${idea.id}`);
  }

  return (
    <AppShell title="Capturar" backHref="/">
      <label className="field-label" htmlFor="idea">
        ¿Qué se te ocurrió?
      </label>
      <textarea
        id="idea"
        className="field field-lg"
        rows={6}
        placeholder="No hace falta que esté claro."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <button
        type="button"
        className="btn-primary btn-block"
        disabled={!text.trim()}
        onClick={save}
      >
        Guardar idea
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
