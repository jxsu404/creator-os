"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { IdeaRow } from "@/components/IdeaRow";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  groupIdeasByStatus,
  STATUS_GROUP_LABEL,
  STATUS_GROUP_TONE,
  type IdeaStatusGroup,
} from "@/lib/idea-labels";
import { backfillIdeaTitles } from "@/lib/idea-title";
import { getIdeas, getProfile } from "@/lib/storage";
import { onSynced } from "@/lib/sync";
import type { Idea } from "@/lib/types";

const READY_BANNER_KEY = "creatoros_ready_banner";
const RECORDED_BANNER_KEY = "creatoros_recorded_banner";

const SECTION_ORDER: IdeaStatusGroup[] = ["pending", "ready", "recorded"];

function IdeasList() {
  const pathname = usePathname();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [banner, setBanner] = useState("");
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

  const grouped = groupIdeasByStatus(ideas);
  const total =
    grouped.pending.length + grouped.ready.length + grouped.recorded.length;

  return (
    <AppShell title="Ideas">
      <div className="create-actions">
        <Link href="/capture" className="btn-primary btn-block">
          Nueva idea
        </Link>
        <Link href="/guion" className="btn-secondary btn-block">
          Nuevo guion
        </Link>
      </div>

      {banner ? (
        <p className="banner-success" role="status" aria-live="polite">
          {banner}
        </p>
      ) : null}

      {total === 0 ? (
        <p className="empty-state">Captura una idea para empezar.</p>
      ) : (
        SECTION_ORDER.map((key) => {
          const items = grouped[key];
          if (items.length === 0) return null;
          const tone = STATUS_GROUP_TONE[key];
          return (
            <section key={key} className="section">
              <div className="section-head">
                <h2 className="section-title">
                  <span
                    className={`status-group-dot tone-${tone}`}
                    aria-hidden
                  />
                  {STATUS_GROUP_LABEL[key]}
                  <span className="section-count">{items.length}</span>
                </h2>
              </div>
              <div className={`stack${key === "recorded" ? " stack-quiet" : ""}`}>
                {items.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} niches={niches} />
                ))}
              </div>
            </section>
          );
        })
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
