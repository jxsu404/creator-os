"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { SEED_GAMES } from "@/lib/content-os-seed";
import { withUser1Defaults } from "@/lib/profile-context";
import type { GameBrief } from "@/lib/types";
import { getProfile, saveProfile } from "@/lib/storage";

function shortGameLabel(name: string) {
  return name.split("(")[0].trim();
}

function GamesSettings() {
  const router = useRouter();
  const [activeGameId, setActiveGameId] = useState("anime-fighting-simulator");
  const [game, setGame] = useState<GameBrief | null>(null);
  const [library, setLibrary] = useState<GameBrief[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (!profile) return;
    const p = withUser1Defaults(profile);
    setActiveGameId(p.activeGameId || "anime-fighting-simulator");
    setLibrary(p.gamesLibrary || SEED_GAMES.map((g) => g.brief));
    setGame(p.gameBrief!);
  }, []);

  function selectGame(id: string) {
    if (!game) return;
    const nextLib = library.map((g) => (g.id === game.id ? { ...game } : g));
    const selected = nextLib.find((g) => g.id === id) || game;
    setLibrary(nextLib);
    setActiveGameId(id);
    setGame({ ...selected });
  }

  function save() {
    if (!game) return;
    const existing = getProfile();
    if (!existing) return;
    const base = withUser1Defaults(existing);
    const nextLib = library.map((g) => (g.id === game.id ? { ...game } : g));
    if (!nextLib.some((g) => g.id === game.id)) nextLib.push(game);

    saveProfile({
      ...base,
      useGameContext: true,
      activeGameId,
      gamesLibrary: nextLib,
      gameBrief: {
        ...game,
        latestUpdate: game.latestUpdate.trim(),
        latestUpdateAt: game.latestUpdate.trim()
          ? game.latestUpdateAt || new Date().toISOString().slice(0, 10)
          : "",
      },
    });
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      router.push("/profile");
    }, 500);
  }

  if (!game) {
    return (
      <AppShell title="Juegos" backHref="/profile">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Juegos" backHref="/profile">
      <p className="muted">Elige el juego activo para la IA.</p>

      <div className="chip-grid">
        {library.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`chip ${activeGameId === g.id ? "chip-active" : ""}`}
            onClick={() => selectGame(g.id)}
          >
            {shortGameLabel(g.name)}
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="update">
        Update reciente
      </label>
      <textarea
        id="update"
        className="field"
        rows={5}
        placeholder="Pega lo último de este juego…"
        value={game.latestUpdate}
        onChange={(e) =>
          setGame({
            ...game,
            latestUpdate: e.target.value,
            latestUpdateAt: e.target.value.trim()
              ? new Date().toISOString().slice(0, 10)
              : "",
          })
        }
      />
      {game.latestUpdateAt ? (
        <p className="idea-meta">Guardado · {game.latestUpdateAt}</p>
      ) : null}

      {saved ? <p className="success">Guardado.</p> : null}

      <button type="button" className="btn-primary btn-block" onClick={save}>
        Guardar
      </button>
    </AppShell>
  );
}

export default function GamesPage() {
  return (
    <RequireOnboarding>
      <GamesSettings />
    </RequireOnboarding>
  );
}
