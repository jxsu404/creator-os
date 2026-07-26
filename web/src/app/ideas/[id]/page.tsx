"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { getIdea, upsertIdea } from "@/lib/storage";
import type { Idea } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

function IdeaDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);

  useEffect(() => {
    const found = getIdea(id);
    if (!found) {
      router.replace("/");
      return;
    }
    setIdea(found);
  }, [id, router]);

  if (!idea) {
    return (
      <AppShell backHref="/">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  function saveText(rawText: string) {
    const next = {
      ...idea!,
      rawText,
      updatedAt: new Date().toISOString(),
    };
    upsertIdea(next);
    setIdea(next);
  }

  function archive() {
    const next = {
      ...idea!,
      status: "archived" as const,
      updatedAt: new Date().toISOString(),
    };
    upsertIdea(next);
    router.push("/");
  }

  function restore() {
    const next = {
      ...idea!,
      status: "captured" as const,
      updatedAt: new Date().toISOString(),
    };
    upsertIdea(next);
    setIdea(next);
  }

  const primary =
    idea.status === "captured" ? (
      <Link href={`/ideas/${idea.id}/directions`} className="btn-primary btn-block">
        Ver tres enfoques
      </Link>
    ) : idea.status === "in_progress" ? (
      <Link href={`/ideas/${idea.id}/draft`} className="btn-primary btn-block">
        Seguir con el borrador
      </Link>
    ) : idea.status === "ready" ? (
      <>
        <Link href={`/ideas/${idea.id}/draft`} className="btn-primary btn-block">
          Abrir guía / guion
        </Link>
        <Link href={`/ideas/${idea.id}/draft`} className="btn-secondary btn-block">
          Seguir editando
        </Link>
      </>
    ) : (
      <button type="button" className="btn-primary btn-block" onClick={restore}>
        Restaurar
      </button>
    );

  return (
    <AppShell title="Idea" backHref="/">
      <span className={`status-pill status-${idea.status}`}>
        {STATUS_LABEL[idea.status]}
      </span>

      <label className="field-label" htmlFor="raw">
        Texto de la idea
      </label>
      <textarea
        id="raw"
        className="field"
        rows={5}
        value={idea.rawText}
        onChange={(e) => saveText(e.target.value)}
      />

      {primary}

      {idea.status !== "archived" ? (
        <button type="button" className="btn-ghost" onClick={archive}>
          Archivar idea
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
