"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  DictationButton,
  appendDictation,
} from "@/components/DictationButton";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  ensureIdeaTitle,
  invalidateAndRegenerateTitle,
} from "@/lib/idea-title";
import { getIdea, upsertIdea } from "@/lib/storage";
import type { Idea } from "@/lib/types";

function IdeaDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const ideaRef = useRef<Idea | null>(null);
  const saveTimer = useRef<number | null>(null);
  const titleTimer = useRef<number | null>(null);

  useEffect(() => {
    const found = getIdea(id);
    if (!found) {
      router.replace("/ideas");
      return;
    }
    ideaRef.current = found;
    setIdea(found);
    void ensureIdeaTitle(found).then((title) => {
      if (!title) return;
      setIdea((prev) => {
        if (!prev || prev.id !== found.id || prev.title) return prev;
        const next = { ...prev, title };
        ideaRef.current = next;
        return next;
      });
    });
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (ideaRef.current) upsertIdea(ideaRef.current);
      }
      if (titleTimer.current) {
        window.clearTimeout(titleTimer.current);
        titleTimer.current = null;
      }
    };
  }, []);

  const saveText = useCallback((rawText: string) => {
    const current = ideaRef.current;
    if (!current) return;
    const next: Idea = {
      ...current,
      rawText,
      title: undefined,
      updatedAt: new Date().toISOString(),
    };
    ideaRef.current = next;
    setIdea(next);

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (ideaRef.current) upsertIdea(ideaRef.current);
      saveTimer.current = null;
    }, 350);

    if (titleTimer.current) window.clearTimeout(titleTimer.current);
    titleTimer.current = window.setTimeout(() => {
      const latest = ideaRef.current;
      if (!latest?.rawText.trim()) return;
      void invalidateAndRegenerateTitle(latest).then((title) => {
        if (!title) return;
        setIdea((prev) => {
          if (!prev || prev.id !== latest.id) return prev;
          const withTitle = { ...prev, title };
          ideaRef.current = withTitle;
          return withTitle;
        });
      });
      titleTimer.current = null;
    }, 900);
  }, []);

  const onTranscript = useCallback(
    (transcript: string) => {
      const current = ideaRef.current;
      if (!current) return;
      saveText(appendDictation(current.rawText, transcript));
    },
    [saveText]
  );

  if (!idea) {
    return (
      <AppShell backHref="/ideas">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  function flushIdea(next: Idea) {
    upsertIdea(next);
    ideaRef.current = next;
    setIdea(next);
  }

  function archive() {
    const ok = window.confirm(
      "¿Archivar esta idea? Dejará de verse en el Home."
    );
    if (!ok) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const current = ideaRef.current ?? idea!;
    flushIdea({
      ...current,
      status: "archived",
      updatedAt: new Date().toISOString(),
    });
    router.push("/ideas");
  }

  function restore() {
    const current = ideaRef.current ?? idea!;
    flushIdea({
      ...current,
      status: "captured",
      updatedAt: new Date().toISOString(),
    });
  }

  const primary =
    idea.status === "captured" ? (
      <Link
        href={`/ideas/${idea.id}/directions`}
        className="btn-primary btn-block"
      >
        Ver tres enfoques
      </Link>
    ) : idea.status === "in_progress" ? (
      idea.draft ? (
        <Link
          href={`/ideas/${idea.id}/draft`}
          className="btn-primary btn-block"
        >
          Seguir con la guía
        </Link>
      ) : (
        <Link
          href={`/ideas/${idea.id}/directions`}
          className="btn-primary btn-block"
        >
          Ver tres enfoques
        </Link>
      )
    ) : idea.status === "ready" ? (
      <>
        {idea.draft ? (
          <Link
            href={`/ideas/${idea.id}/script`}
            className="btn-primary btn-block"
          >
            Abrir guion
          </Link>
        ) : (
          <Link
            href={`/ideas/${idea.id}/directions`}
            className="btn-primary btn-block"
          >
            Ver tres enfoques
          </Link>
        )}
        <button
          type="button"
          className="btn-secondary btn-block"
          onClick={() => {
            const current = ideaRef.current ?? idea!;
            flushIdea({
              ...current,
              status: "recorded",
              updatedAt: new Date().toISOString(),
            });
            try {
              sessionStorage.setItem("creatoros_recorded_banner", "1");
            } catch {
              /* ignore */
            }
            router.push("/ideas");
          }}
        >
          Ya lo grabé
        </button>
        <button type="button" className="btn-danger btn-block" onClick={archive}>
          Descartar
        </button>
      </>
    ) : idea.status === "recorded" ? (
      <>
        {idea.draft ? (
          <Link
            href={`/ideas/${idea.id}/script`}
            className="btn-primary btn-block"
          >
            Ver guion
          </Link>
        ) : null}
        <button
          type="button"
          className="btn-secondary btn-block"
          onClick={() => {
            const current = ideaRef.current ?? idea!;
            flushIdea({
              ...current,
              status: "ready",
              updatedAt: new Date().toISOString(),
            });
          }}
        >
          Devolver a lista para grabar
        </button>
        <button type="button" className="btn-danger btn-block" onClick={archive}>
          Archivar
        </button>
      </>
    ) : (
      <button type="button" className="btn-primary btn-block" onClick={restore}>
        Restaurar
      </button>
    );

  return (
    <AppShell title="Idea" backHref="/ideas">
      {idea.title ? <h2 className="idea-heading">{idea.title}</h2> : null}
      <textarea
        id="raw"
        className="field"
        rows={4}
        value={idea.rawText}
        onChange={(e) => saveText(e.target.value)}
        aria-label="Idea"
      />

      {idea.status !== "archived" ? (
        <DictationButton onTranscript={onTranscript} />
      ) : null}

      {primary}

      {idea.status !== "archived" &&
      idea.status !== "ready" &&
      idea.status !== "recorded" ? (
        <button type="button" className="text-link" onClick={archive}>
          Archivar
        </button>
      ) : null}
    </AppShell>
  );
}

export default function IdeaPage() {
  return (
    <RequireOnboarding>
      <IdeaDetail />
    </RequireOnboarding>
  );
}
