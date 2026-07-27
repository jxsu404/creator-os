"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { withUser1Defaults } from "@/lib/profile-context";
import { getProfile } from "@/lib/storage";
import { isCloudSyncEnabled, onSynced } from "@/lib/sync";
import type { CreatorProfile } from "@/lib/types";

type AiProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
  available: boolean;
  remainingMs: number;
  remainingLabel: string | null;
  detail: string | null;
  reason: string | null;
};

type AiStatusResponse = {
  providers: AiProviderStatus[];
  anyAvailable: boolean;
  nextReady: {
    label: string;
    remainingLabel: string | null;
  } | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function shortGame(name?: string) {
  if (!name) return "Sin juego";
  return name.split("(")[0].trim();
}

function formatMs(ms: number): string {
  if (ms <= 0) return "ya disponible";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function reasonLabel(reason: string | null): string {
  switch (reason) {
    case "daily_quota":
      return "Cuota diaria";
    case "rate_limit":
      return "Rate limit";
    case "invalid_key":
      return "Key inválida";
    default:
      return "En pausa";
  }
}

function ProfileHub() {
  const router = useRouter();
  const { configured, user, signOut, refreshSync } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [installHint, setInstallHint] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function load() {
      const p = getProfile();
      if (p) setProfile(withUser1Defaults(p));
    }
    load();
    return onSynced(load);
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstallHint(!standalone && configured);
  }, [configured]);

  useEffect(() => {
    let cancelled = false;

    async function loadAi() {
      try {
        const res = await fetch("/api/ai-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as AiStatusResponse;
        if (!cancelled) {
          setAiStatus(data);
          setFetchedAt(Date.now());
          setTick(0);
        }
      } catch {
        /* ignore */
      }
    }

    void loadAi();
    const poll = window.setInterval(() => void loadAi(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    const hasCooldown = aiStatus?.providers.some(
      (p) => p.configured && !p.available && p.remainingMs > 0
    );
    if (!hasCooldown) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [aiStatus]);

  if (!profile) {
    return (
      <AppShell title="Perfil">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  const name = profile.brand?.creatorName || "Tu nombre";
  const bio =
    profile.customDescription.trim() ||
    "Añade una descripción de tu canal.";
  const gameLabel = shortGame(profile.gameBrief?.name);

  // Countdown local entre polls del servidor
  void tick;
  const elapsed = fetchedAt ? Date.now() - fetchedAt : 0;
  const providers = (aiStatus?.providers || []).map((p) => {
    if (!p.available && p.remainingMs > 0) {
      const estimated = Math.max(0, p.remainingMs - elapsed);
      return {
        ...p,
        remainingMs: estimated,
        remainingLabel: formatMs(estimated),
        available: estimated <= 0,
      };
    }
    return p;
  });

  return (
    <AppShell title="Perfil">
      <section className="profile-hero">
        <div className="profile-avatar" aria-hidden>
          {initials(name)}
        </div>
        <h2 className="profile-name">{name}</h2>
        <p className="profile-bio">{bio}</p>
        <Link href="/profile/edit" className="btn-secondary btn-block">
          Editar perfil
        </Link>
      </section>

      <nav className="settings-list" aria-label="Apartados">
        <Link href="/profile/juegos" className="settings-row">
          <div>
            <p className="settings-title">Juegos</p>
            <p className="settings-desc">Activo: {gameLabel}</p>
          </div>
          <span className="chevron" aria-hidden>
            →
          </span>
        </Link>
        <Link href="/profile/personalizacion" className="settings-row">
          <div>
            <p className="settings-title">Personalización</p>
            <p className="settings-desc">Cómo grabas y tono</p>
          </div>
          <span className="chevron" aria-hidden>
            →
          </span>
        </Link>
        <Link href="/profile/conexiones" className="settings-row">
          <div>
            <p className="settings-title">Conexiones</p>
            <p className="settings-desc">
              {profile.youtube?.channelTitle
                ? `YouTube · ${profile.youtube.channelTitle}`
                : "YouTube · TikTok"}
            </p>
          </div>
          <span className="chevron" aria-hidden>
            →
          </span>
        </Link>
      </nav>

      <section className="section">
        <h2 className="section-title">Cuota IA (gratis)</h2>
        <p className="muted">
          Si un proveedor se agota, Creator OS salta al siguiente. Aquí ves
          cuánto falta para que vuelva.
        </p>
        {providers.length === 0 ? (
          <p className="muted">Cargando estado…</p>
        ) : (
          <div className="stack">
            {providers.map((p) => (
              <div
                key={p.id}
                className="settings-row"
                style={{ cursor: "default" }}
              >
                <div>
                  <p className="settings-title">{p.label}</p>
                  <p className="settings-desc">
                    {!p.configured
                      ? "No configurado en .env.local"
                      : p.available
                        ? "Disponible"
                        : `${reasonLabel(p.reason)} · vuelve en ${
                            p.remainingLabel || "…"
                          }`}
                  </p>
                </div>
                <span
                  className={`ai-status-pill${
                    !p.configured
                      ? " ai-status-off"
                      : p.available
                        ? " ai-status-ok"
                        : " ai-status-wait"
                  }`}
                >
                  {!p.configured
                    ? "—"
                    : p.available
                      ? "OK"
                      : p.remainingLabel || "…"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Cuenta</h2>
        {configured ? (
          <div className="stack">
            <div className="settings-row" style={{ cursor: "default" }}>
              <div>
                <p className="settings-title">
                  {user?.email || "Sesión activa"}
                </p>
                <p className="settings-desc">
                  {isCloudSyncEnabled()
                    ? "Sync nube activo · celular ↔ PC"
                    : "Conectando sync…"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">
            Para sync entre celular y PC, configura Supabase en{" "}
            <code>.env.local</code> (ver <code>.env.example</code>).
          </p>
        )}

        {configured ? (
          <>
            <button
              type="button"
              className="btn-secondary btn-block"
              disabled={syncing}
              onClick={() => {
                setSyncing(true);
                void refreshSync().finally(() => setSyncing(false));
              }}
            >
              {syncing ? "Sincronizando…" : "Sincronizar ahora"}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                void signOut().then(() => router.replace("/login"));
              }}
            >
              Cerrar sesión
            </button>
          </>
        ) : null}

        {installHint ? (
          <p className="muted dictation-hint">
            En el celular (Chrome): menú → <strong>Instalar app</strong> o{" "}
            <strong>Añadir a pantalla de inicio</strong> para usarla como app.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <RequireOnboarding>
      <ProfileHub />
    </RequireOnboarding>
  );
}
