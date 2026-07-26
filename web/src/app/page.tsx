"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { getIdeas } from "@/lib/storage";
import type { Idea } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

function IdeaRow({ idea }: { idea: Idea }) {
  const href =
    idea.status === "in_progress" || idea.status === "ready"
      ? `/ideas/${idea.id}/draft`
      : `/ideas/${idea.id}`;

  return (
    <Link href={href} className="idea-row">
      <div>
        <p className="idea-text">{idea.rawText}</p>
        <span className={`status-pill status-${idea.status}`}>
          {STATUS_LABEL[idea.status]}
        </span>
      </div>
      <span className="chevron">→</span>
    </Link>
  );
}

function HomeContent() {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    setIdeas(getIdeas().filter((i) => i.status !== "archived"));
  }, []);

  const inProgress = ideas.filter((i) => i.status === "in_progress");
  const ready = ideas.filter((i) => i.status === "ready");
  const captured = ideas.filter((i) => i.status === "captured");

  return (
    <AppShell>
      <Link href="/capture" className="btn-primary btn-block">
        Capturar idea
      </Link>

      {ideas.length === 0 ? (
        <p className="empty-state">
          Cuando se te ocurra algo, captúralo aquí. Luego lo convertimos en algo
          grabable.
        </p>
      ) : (
        <>
          {inProgress.length > 0 ? (
            <section className="section">
              <h2 className="section-title">Continuar</h2>
              <div className="stack">
                {inProgress.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} />
                ))}
              </div>
            </section>
          ) : null}

          {ready.length > 0 ? (
            <section className="section">
              <h2 className="section-title">Listas para grabar</h2>
              <div className="stack">
                {ready.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} />
                ))}
              </div>
            </section>
          ) : null}

          {captured.length > 0 ? (
            <section className="section">
              <h2 className="section-title">Capturadas</h2>
              <div className="stack">
                {captured.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <RequireOnboarding>
      <HomeContent />
    </RequireOnboarding>
  );
}
