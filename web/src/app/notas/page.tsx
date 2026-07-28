"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  createBlankNote,
  getNotes,
  noteListTitle,
  notePreview,
  upsertNote,
} from "@/lib/notes";
import type { TextNote } from "@/lib/types";

function NotesList() {
  const router = useRouter();
  const pathname = usePathname();
  const [notes, setNotes] = useState<TextNote[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setNotes(getNotes());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [pathname, refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  function createNote() {
    const note = createBlankNote();
    upsertNote(note);
    router.push(`/notas/${note.id}`);
  }

  if (!hydrated) {
    return (
      <AppShell title="Notas">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Notas" backHref="/ideas" backLabel="Volver a Ideas">
      <p className="muted">
        Texto simple: guiones, outlines o apuntes para leer cuando grabes.
      </p>

      <button
        type="button"
        className="btn-primary btn-block"
        onClick={createNote}
      >
        Nueva nota
      </button>

      {notes.length === 0 ? (
        <p className="empty-state">Aún no hay notas. Crea una o guarda un guion desde Ideas.</p>
      ) : (
        <div className="stack">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notas/${note.id}`}
              className="idea-row idea-row-body"
              style={{ display: "block", padding: "var(--space-2)" }}
            >
              <p className="idea-text">{noteListTitle(note)}</p>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                {notePreview(note, 90)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function NotasPage() {
  return (
    <RequireOnboarding>
      <NotesList />
    </RequireOnboarding>
  );
}
