"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  deleteNote,
  getNote,
  noteListTitle,
  upsertNote,
} from "@/lib/notes";
import type { TextNote } from "@/lib/types";

const DELETE_CONFIRM = "¿Borrar esta nota? No se puede deshacer.";

function NoteEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [note, setNote] = useState<TextNote | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const noteRef = useRef<TextNote | null>(null);
  const saveTimer = useRef<number | null>(null);
  const savedLabelTimer = useRef<number | null>(null);

  useEffect(() => {
    const found = getNote(id);
    if (!found) {
      router.replace("/notas");
      return;
    }
    noteRef.current = found;
    setNote(found);
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (noteRef.current) upsertNote(noteRef.current);
      }
      if (savedLabelTimer.current) {
        window.clearTimeout(savedLabelTimer.current);
        savedLabelTimer.current = null;
      }
    };
  }, []);

  if (!note) {
    return (
      <AppShell backHref="/notas" backLabel="Volver a Notas">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  function commit(next: TextNote) {
    upsertNote(next);
    noteRef.current = next;
    setNote(next);
    setSaveState("saved");
    if (savedLabelTimer.current) window.clearTimeout(savedLabelTimer.current);
    savedLabelTimer.current = window.setTimeout(() => setSaveState("idle"), 1600);
  }

  function scheduleBody(body: string) {
    const current = noteRef.current;
    if (!current) return;
    setSaveState("saving");
    const next: TextNote = {
      ...current,
      body,
      updatedAt: new Date().toISOString(),
    };
    noteRef.current = next;
    setNote(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (noteRef.current) commit(noteRef.current);
    }, 350);
  }

  function remove() {
    if (!window.confirm(DELETE_CONFIRM)) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    deleteNote(id);
    router.push("/notas");
  }

  return (
    <AppShell
      title={noteListTitle(note)}
      backHref="/notas"
      backLabel="Volver a Notas"
    >
      <div className="draft-meta">
        <span className="save-indicator" aria-live="polite">
          {saveState === "saving"
            ? "Guardando…"
            : saveState === "saved"
              ? "Guardado"
              : ""}
        </span>
      </div>

      <textarea
        id="note-body"
        className="field field-lg"
        rows={18}
        value={note.body}
        onChange={(e) => scheduleBody(e.target.value)}
        placeholder="Escribe aquí… guion, outline o apunte."
        autoFocus
        aria-label="Texto de la nota"
      />

      <div className="sticky-actions">
        <button type="button" className="btn-danger" onClick={remove}>
          Borrar nota
        </button>
      </div>
    </AppShell>
  );
}

export default function NotePage() {
  return (
    <RequireOnboarding>
      <NoteEditor />
    </RequireOnboarding>
  );
}
