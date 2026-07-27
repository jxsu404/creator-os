"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { LandingPage } from "@/components/LandingPage";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { quoteForSession, tipsForSession, type HomeTip } from "@/lib/home-copy";
import { ideaHref } from "@/lib/idea-href";
import { backfillIdeaTitles, ideaTitle } from "@/lib/idea-title";
import { IdeaThumb } from "@/components/IdeaThumb";
import { IdeaLabels } from "@/components/IdeaLabels";
import {
  getIdeas,
  getProfile,
  patchIdea,
  saveProfile,
  youtubeCacheFresh,
} from "@/lib/storage";
import { onSynced } from "@/lib/sync";
import type { CreatorProfile, Idea } from "@/lib/types";
import {
  groupIdeasByStatus,
  STATUS_GROUP_LABEL,
  STATUS_GROUP_TONE,
  type IdeaStatusGroup,
} from "@/lib/idea-labels";
import { profileContextFor, withUser1Defaults } from "@/lib/profile-context";
import {
  buildTipsContext,
  isHomeTipsCacheFresh,
  normalizeTips,
  readHomeTipsCache,
  writeHomeTipsCache,
} from "@/lib/tips-context";
import { formatYtCount } from "@/lib/youtube-format";

type PublishedItem = {
  key: string;
  title: string;
  meta: string;
  href: string;
  /** Link interno a stats de YouTube (no abre YouTube externo). */
  youtube?: boolean;
  thumb?: string;
  idea?: Idea;
};

let ytInFlight: Promise<void> | null = null;

function HomeHub() {
  const pathname = usePathname();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [ytError, setYtError] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [quote, setQuote] = useState("");
  const [tips, setTips] = useState<HomeTip[]>([]);
  const backfillKeyRef = useRef("");
  const quoteReadyRef = useRef(false);
  const tipsSettledRef = useRef("");

  const refreshLocal = useCallback(() => {
    setIdeas(getIdeas().filter((i) => i.status !== "archived"));
    const p = getProfile();
    setProfile(p ? withUser1Defaults(p) : null);
  }, []);

  const archiveIdea = useCallback(
    (idea: Idea) => {
      const ok = window.confirm(
        "¿Archivar esta idea? Dejará de verse en el Home."
      );
      if (!ok) return;
      patchIdea(idea.id, {
        status: "archived",
        updatedAt: new Date().toISOString(),
      });
      refreshLocal();
    },
    [refreshLocal]
  );

  useEffect(() => {
    if (!hydrated || quoteReadyRef.current) return;
    const niches = getProfile()?.niches || [];
    setQuote(quoteForSession(niches));
    quoteReadyRef.current = true;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const p = getProfile();
    const allIdeas = getIdeas();
    const niches = p?.niches || [];
    const fallback = tipsForSession(niches, 3);
    const ctx = buildTipsContext(p, allIdeas);

    if (tipsSettledRef.current === ctx.fingerprint) {
      return;
    }

    const cached = readHomeTipsCache();
    if (cached && isHomeTipsCacheFresh(cached, ctx.fingerprint)) {
      tipsSettledRef.current = ctx.fingerprint;
      setTips(cached.tips.slice(0, 3));
      return;
    }

    // Sin videos recientes: tips estáticos por nicho (sin gastar cuota).
    if (!ctx.hasRecentSignal) {
      tipsSettledRef.current = ctx.fingerprint;
      setTips(fallback);
      return;
    }

    // Mostrar estáticos mientras llega la IA.
    setTips(fallback);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/generate-tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileContext: p ? profileContextFor(p) : "",
            recentContent: ctx.recentContent,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        const next = normalizeTips(data.tips);
        if (next.length < 3) throw new Error("tips incompletos");
        if (cancelled) return;
        writeHomeTipsCache({
          fingerprint: ctx.fingerprint,
          generatedAt: new Date().toISOString(),
          tips: next,
        });
        tipsSettledRef.current = ctx.fingerprint;
        setTips(next);
      } catch {
        if (cancelled) return;
        tipsSettledRef.current = ctx.fingerprint;
        setTips(fallback);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, profile, ideas]);

  const syncYoutube = useCallback(async (force = false) => {
    if (ytInFlight) await ytInFlight;

    const p = getProfile();
    if (!p?.youtube?.channelId) return;
    if (!force && youtubeCacheFresh(p)) return;

    setYtLoading(true);
    setYtError("");
    ytInFlight = (async () => {
      try {
        const res = await fetch("/api/youtube/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: p.youtube!.channelId,
            uploadsPlaylistId: p.youtube!.uploadsPlaylistId,
            channelTitle: p.youtube!.channelTitle,
            channelHandle: p.youtube!.channelHandle,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error YouTube");
        const latest = getProfile() || p;
        if (
          !latest.youtube?.channelId ||
          latest.youtube.channelId !== p.youtube!.channelId ||
          latest.youtube.uploadsPlaylistId !== p.youtube!.uploadsPlaylistId
        ) {
          return;
        }
        const next = withUser1Defaults({
          ...latest,
          youtubeCache: {
            videos: data.videos || [],
            fetchedAt: data.fetchedAt || new Date().toISOString(),
          },
        });
        saveProfile(next);
        setProfile(next);
      } catch (e) {
        setYtError(
          e instanceof Error ? e.message : "No pude cargar YouTube."
        );
      } finally {
        setYtLoading(false);
        ytInFlight = null;
      }
    })();
    await ytInFlight;
  }, []);

  useEffect(() => {
    refreshLocal();
    setHydrated(true);
  }, [pathname, refreshLocal]);

  useEffect(() => {
    if (!hydrated) return;
    void syncYoutube(false);
  }, [hydrated, syncYoutube]);

  useEffect(() => {
    const onFocus = () => refreshLocal();
    window.addEventListener("focus", onFocus);
    const offSync = onSynced(refreshLocal);
    return () => {
      window.removeEventListener("focus", onFocus);
      offSync();
    };
  }, [refreshLocal]);

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
      <AppShell>
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  const niches = profile?.niches || [];
  const grouped = groupIdeasByStatus(ideas);
  const pending = grouped.pending.slice(0, 4);
  const ready = grouped.ready.slice(0, 4);
  const recordedIdeas = grouped.recorded.slice(0, 4);
  const ytVideos = profile?.youtubeCache?.videos || [];

  const published: PublishedItem[] = [
    ...ytVideos.map((v) => {
      const date = v.publishedAt
        ? new Date(v.publishedAt).toLocaleDateString("es")
        : "YouTube";
      const views =
        v.viewCount != null ? `${formatYtCount(v.viewCount)} vistas` : null;
      return {
        key: `yt-${v.id}`,
        title: v.title,
        meta: views ? `${views} · ${date}` : date,
        href: `/youtube/${v.id}`,
        youtube: true,
        thumb: v.thumbnailUrl,
      };
    }),
    ...recordedIdeas.map((idea) => ({
      key: idea.id,
      title: ideaTitle(idea, 80),
      meta: "En Ideazo",
      href: ideaHref(idea),
      thumb: idea.thumbnailUrl?.trim() || undefined,
      idea,
    })),
  ].slice(0, 6);

  const ytConnected = Boolean(profile?.youtube?.channelId);
  const hasAnyIdeas = ideas.length > 0;
  const statusSections: {
    key: IdeaStatusGroup;
    items: Idea[];
  }[] = [
    { key: "pending", items: pending },
    { key: "ready", items: ready },
  ];

  return (
    <AppShell>
      <section className="home-quote">
        <p className="home-quote-text">{quote}</p>
      </section>

      {!hasAnyIdeas ? (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Ideas</h2>
            <Link href="/ideas" className="section-link">
              Ver todas
            </Link>
          </div>
          <p className="muted">
            Aún no hay ideas. Toca el{" "}
            <Link href="/capture" className="inline-link">
              + del centro
            </Link>{" "}
            para crear tu primer video.
          </p>
        </section>
      ) : (
        statusSections.map(({ key, items }) => {
          if (items.length === 0) return null;
          const tone = STATUS_GROUP_TONE[key];
          return (
            <section key={key} className="section">
              <div className="section-head">
                <h2 className="section-title">
                  <span className={`status-group-dot tone-${tone}`} aria-hidden />
                  {STATUS_GROUP_LABEL[key]}
                </h2>
                <Link href="/ideas" className="section-link">
                  Ver todas
                </Link>
              </div>
              <div className="stack">
                {items.map((idea) => (
                  <div key={idea.id} className="idea-row idea-row-media">
                    <IdeaThumb idea={idea} niches={niches} />
                    <Link href={ideaHref(idea)} className="idea-row-body">
                      <p className="idea-text">{ideaTitle(idea)}</p>
                      <IdeaLabels idea={idea} niches={niches} />
                    </Link>
                    <button
                      type="button"
                      className="section-link"
                      onClick={() => archiveIdea(idea)}
                    >
                      Archivar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">
            <span className="status-group-dot tone-green" aria-hidden />
            Publicados
          </h2>
          {ytConnected ? (
            <button
              type="button"
              className="section-link"
              disabled={ytLoading}
              onClick={() => void syncYoutube(true)}
            >
              {ytLoading ? "…" : "Actualizar"}
            </button>
          ) : (
            <Link href="/profile/conexiones" className="section-link">
              Conectar
            </Link>
          )}
        </div>

        {ytError ? <p className="error">{ytError}</p> : null}

        {!ytConnected && published.length === 0 ? (
          <p className="muted">
            Conecta YouTube para ver tus videos aquí, o marca piezas como
            grabadas en Ideas.
          </p>
        ) : published.length === 0 ? (
          <p className="muted">
            {ytLoading
              ? "Cargando videos…"
              : "Sin videos todavía. Publica o marca una idea como grabada."}
          </p>
        ) : (
          <div className="stack">
            {published.map((item) => (
              <Link key={item.key} href={item.href} className="pub-row">
                {item.idea ? (
                  <IdeaThumb idea={item.idea} niches={niches} size="sm" />
                ) : item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumb}
                    alt=""
                    className="pub-thumb"
                    width={72}
                    height={40}
                  />
                ) : (
                  <span className="pub-thumb pub-thumb-empty" />
                )}
                <div className="pub-body">
                  <p className="pub-title">{item.title}</p>
                  {item.idea ? (
                    <IdeaLabels idea={item.idea} niches={niches} />
                  ) : (
                    <span className="idea-meta">{item.meta}</span>
                  )}
                </div>
                {item.youtube ? (
                  <span className="chevron" aria-hidden>
                    →
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
        {hasAnyIdeas ? (
          <Link href="/ideas" className="text-link">
            Ver todas las ideas
          </Link>
        ) : null}
      </section>

      <section className="section">
        <h2 className="section-title">Consejos</h2>
        <div className="tips-list">
          {tips.map((tip) => (
            <div key={tip.title} className="tip-row">
              <p className="tip-title">{tip.title}</p>
              <p className="tip-body">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default function HomePage() {
  const { configured, loading, user } = useAuth();

  if (configured && !loading && !user) {
    return <LandingPage />;
  }

  return (
    <RequireOnboarding>
      <HomeHub />
    </RequireOnboarding>
  );
}
