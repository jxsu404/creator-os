"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { withUser1Defaults } from "@/lib/profile-context";
import { getProfile, saveProfile } from "@/lib/storage";
import type { YoutubeCachedVideo } from "@/lib/types";
import {
  formatYtCount,
  formatYtDate,
  formatYtDuration,
} from "@/lib/youtube-format";

function YoutubeVideoDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [video, setVideo] = useState<YoutubeCachedVideo | null>(null);
  const [channelTitle, setChannelTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFromCache = useCallback(() => {
    const p = getProfile();
    if (!p?.youtube?.channelId) {
      setError("Conecta YouTube en Perfil → Conexiones.");
      setLoading(false);
      return null;
    }
    setChannelTitle(p.youtube.channelTitle || "");
    const found = p.youtubeCache?.videos.find((v) => v.id === id) || null;
    if (found) setVideo(found);
    return found;
  }, [id]);

  const refreshStats = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/youtube/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error YouTube");
      const nextVideo = data.video as YoutubeCachedVideo;
      setVideo(nextVideo);

      const p = getProfile();
      if (p?.youtubeCache) {
        const videos = [...p.youtubeCache.videos];
        const idx = videos.findIndex((v) => v.id === id);
        if (idx >= 0) videos[idx] = { ...videos[idx], ...nextVideo };
        else videos.unshift(nextVideo);
        saveProfile(
          withUser1Defaults({
            ...p,
            youtubeCache: {
              videos,
              fetchedAt: data.fetchedAt || new Date().toISOString(),
            },
          })
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude actualizar stats.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const cached = loadFromCache();
    if (!cached) {
      void refreshStats();
      return;
    }
    setLoading(false);
    // Si el cache es viejo (sin stats), refresca en segundo plano
    if (cached.viewCount == null) {
      void refreshStats();
    }
  }, [loadFromCache, refreshStats]);

  if (loading && !video) {
    return (
      <AppShell title="Video" backHref="/">
        <p className="muted">Cargando estadísticas…</p>
      </AppShell>
    );
  }

  if (!video) {
    return (
      <AppShell title="Video" backHref="/">
        <p className="error">{error || "No encontré ese video."}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.replace("/")}
        >
          Volver al inicio
        </button>
      </AppShell>
    );
  }

  const stats = [
    { label: "Vistas", value: formatYtCount(video.viewCount) },
    { label: "Likes", value: formatYtCount(video.likeCount) },
    { label: "Comentarios", value: formatYtCount(video.commentCount) },
    { label: "Duración", value: formatYtDuration(video.duration) },
  ];

  return (
    <AppShell title="Estadísticas" backHref="/">
      <article className="yt-detail">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            className="yt-detail-thumb"
            width={640}
            height={360}
          />
        ) : (
          <div className="yt-detail-thumb yt-detail-thumb-empty" />
        )}

        <h1 className="yt-detail-title">{video.title}</h1>
        {channelTitle ? (
          <p className="muted yt-detail-channel">{channelTitle}</p>
        ) : null}
        <p className="idea-meta">
          Publicado {formatYtDate(video.publishedAt)}
        </p>

        {error ? <p className="error">{error}</p> : null}

        <div className="yt-stat-grid" role="list">
          {stats.map((s) => (
            <div key={s.label} className="yt-stat" role="listitem">
              <span className="yt-stat-value">{s.value}</span>
              <span className="yt-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="yt-detail-actions">
          <button
            type="button"
            className="btn-secondary btn-block"
            disabled={refreshing}
            onClick={() => void refreshStats()}
          >
            {refreshing ? "Actualizando…" : "Actualizar números"}
          </button>
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary btn-block"
          >
            Abrir en YouTube
          </a>
          <Link href="/" className="text-link">
            Volver al inicio
          </Link>
        </div>
      </article>
    </AppShell>
  );
}

export default function YoutubeVideoPage() {
  return (
    <RequireOnboarding>
      <YoutubeVideoDetail />
    </RequireOnboarding>
  );
}
