"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { withUser1Defaults } from "@/lib/profile-context";
import { getProfile, saveProfile } from "@/lib/storage";
import type { CreatorProfile } from "@/lib/types";

function ConnectionsSettings() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const p = getProfile();
    if (p) {
      const next = withUser1Defaults(p);
      setProfile(next);
      setInput(
        next.youtube?.channelHandle ||
          next.youtube?.channelId ||
          ""
      );
    }
  }, []);

  async function connectYoutube() {
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/youtube/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelInput: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const existing = getProfile();
      if (!existing) throw new Error("Perfil no encontrado.");
      const next = withUser1Defaults({
        ...existing,
        youtube: {
          channelId: data.channel.channelId,
          channelTitle: data.channel.title,
          channelHandle: data.channel.handle,
          uploadsPlaylistId: data.channel.uploadsPlaylistId,
          connectedAt: new Date().toISOString(),
          subscriberCount: data.channel.subscriberCount,
          videoCount: data.channel.videoCount,
        },
        youtubeCache: {
          videos: data.videos || [],
          fetchedAt: data.fetchedAt || new Date().toISOString(),
        },
      });
      saveProfile(next);
      setProfile(next);
      setOk(`Conectado: ${data.channel.title}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude conectar.");
    } finally {
      setLoading(false);
    }
  }

  function disconnectYoutube() {
    const existing = getProfile();
    if (!existing) return;
    const next = withUser1Defaults({
      ...existing,
      youtube: null,
      youtubeCache: null,
    });
    saveProfile(next);
    setProfile(next);
    setInput("");
    setOk("YouTube desconectado.");
  }

  if (!profile) {
    return (
      <AppShell title="Conexiones" backHref="/profile">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  const yt = profile.youtube;

  return (
    <AppShell title="Conexiones" backHref="/profile">
      <section className="section">
        <h2 className="section-title">YouTube</h2>
        <p className="muted">
          Pega tu @, la URL del canal o el ID. Conectamos con YouTube para
          mostrar tus videos aquí.
        </p>

        {yt ? (
          <p className="idea-meta">
            Conectado · {yt.channelTitle}
            {yt.channelHandle ? ` · ${yt.channelHandle}` : ""}
            {yt.subscriberCount != null
              ? ` · ${yt.subscriberCount.toLocaleString("es")} suscriptores`
              : ""}
          </p>
        ) : null}

        <label className="field-label" htmlFor="yt">
          Canal
        </label>
        <input
          id="yt"
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@tucanal o youtube.com/@…"
        />

        {error ? <p className="error">{error}</p> : null}
        {ok ? <p className="success">{ok}</p> : null}

        <button
          type="button"
          className="btn-primary btn-block"
          disabled={loading || !input.trim()}
          onClick={() => void connectYoutube()}
        >
          {loading ? "Conectando…" : yt ? "Reconectar" : "Conectar YouTube"}
        </button>

        {yt ? (
          <button
            type="button"
            className="text-link"
            onClick={disconnectYoutube}
          >
            Desconectar
          </button>
        ) : null}
      </section>

      <section className="section">
        <h2 className="section-title">TikTok</h2>
        <p className="muted">
          Pronto podrás ver también tus videos de TikTok por aquí.
        </p>
        <button type="button" className="btn-secondary btn-block" disabled>
          Conectar TikTok
        </button>
      </section>
    </AppShell>
  );
}

export default function ConnectionsPage() {
  return (
    <RequireOnboarding>
      <ConnectionsSettings />
    </RequireOnboarding>
  );
}
