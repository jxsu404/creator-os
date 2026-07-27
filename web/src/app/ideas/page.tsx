"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { IdeaThumb } from "@/components/IdeaThumb";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { ideaHref } from "@/lib/idea-href";
import { backfillIdeaTitles, ideaTitle } from "@/lib/idea-title";
import { getIdeas, getProfile } from "@/lib/storage";
import { onSynced } from "@/lib/sync";
import type { Idea } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const READY_BANNER_KEY = "creatoros_ready_banner";
const RECORDED_BANNER_KEY = "creatoros_recorded_banner";

function IdeaRow({ idea, niches }: { idea: Idea; niches: string[] }) {
  return (
    <Link href={ideaHref(idea)} className="idea-row idea-row-media">
      <IdeaThumb idea={idea} niches={niches} />
      <div className="idea-row-body">
        <p className="idea-text">{ideaTitle(idea)}</p>
        <span className="idea-meta">{STATUS_LABEL[idea.status]}</span>
      </div>
      <span className="chevron" aria-hidden>
        →
      </span>
    </Link>
  );
}

function IdeasList() {
  const pathname = usePathname();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [banner, setBanner] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const backfillKeyRef = useRef("");

  const refresh = useCallback(() => {
    setIdeas(getIdeas().filter((i) => i.status !== "archived"));
    setNiches(getProfile()?.niches || []);
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    try {
      if (sessionStorage.getItem(READY_BANNER_KEY) === "1") {
        sessionStorage.removeItem(READY_BANNER_KEY);
        setBanner("Lista para grabar.");
        const t = window.setTimeout(() => setBanner(""), 2800);
        return () => window.clearTimeout(t);
      }
      if (sessionStorage.getItem(RECORDED_BANNER_KEY) === "1") {
        sessionStorage.removeItem(RECORDED_BANNER_KEY);
        setBanner("Marcada como grabada.");
        const t = window.setTimeout(() => setBanner(""), 2800);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [pathname, refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const offSync = onSynced(refresh);
    return () => {
      window.removeEventListener("focus", onFocus);
      offSync();
    };
  }, [refresh]);

  useEffect(() => {
    if (!hydrated) return;
    const missingKey = ideas
      .filter((i) => !i.title?.trim() && i.rawText.trim())
      .map((i) => i.id)
      .sort()
      .join("|");
    if (!missingKey || missingKey === backfillKeyRef.current) return;
    backfillKeyRef.current = missingKey;
    backfillIdeaTitles(ideas, (id) => {
      const fresh = getIdeas().find((x) => x.id === id);
      if (!fresh) return;
      setIdeas((prev) => prev.map((i) => (i.id === id ? fresh : i)));
    });
  }, [hydrated, ideas]);

  if (!hydrated) {
    return (
      <AppShell title="Ideas">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  const active = ideas.filter((i) => i.status !== "recorded");
  const recorded = ideas.filter((i) => i.status === "recorded");

  return (
    <AppShell title="Ideas">
      <Link href="/capture" className="btn-primary btn-block">
        Nueva idea
      </Link>

      {banner ? <p className="banner-success">{banner}</p> : null}

      {active.length === 0 && recorded.length === 0 ? (
        <p className="empty-state">Captura una idea para empezar.</p>
      ) : (
        <>
          {active.length > 0 ? (
            <section className="section">
              <div className="stack">
                {active.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} niches={niches} />
                ))}
              </div>
            </section>
          ) : null}

          {recorded.length > 0 ? (
            <button
              type="button"
              className="text-link"
              onClick={() => setShowDone((v) => !v)}
            >
              {showDone ? "Ocultar grabadas" : `Grabadas (${recorded.length})`}
            </button>
          ) : null}

          {showDone ? (
            <div className="stack stack-quiet">
              {recorded.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} niches={niches} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

export default function IdeasPage() {
  return (
    <RequireOnboarding>
      <IdeasList />
    </RequireOnboarding>
  );
}
