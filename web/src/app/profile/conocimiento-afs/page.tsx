"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { hasGamingNiche, withUser1Defaults } from "@/lib/profile-context";
import { getProfile } from "@/lib/storage";

type ListMeta = { name: string; count: number };

type KnowledgeItem = {
  id: string;
  list: string;
  title: string;
  preview: string;
};

type IndexResponse = {
  boardName: string;
  boardUrl: string;
  syncedAt: string;
  chunkCount: number;
  lists: ListMeta[];
  items: KnowledgeItem[];
  error?: string;
};

type ChunkResponse = {
  chunk: {
    id: string;
    list: string;
    title: string;
    body: string;
  };
};

function formatSyncedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function AfsKnowledgeBrowser() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [list, setList] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<IndexResponse | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openBody, setOpenBody] = useState("");
  const [openLoading, setOpenLoading] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (!profile) {
      setAllowed(false);
      router.replace("/profile");
      return;
    }
    const p = withUser1Defaults(profile);
    if (!hasGamingNiche(p)) {
      setAllowed(false);
      router.replace("/profile");
      return;
    }
    setAllowed(true);
  }, [router]);

  const loadIndex = useCallback(async (opts?: {
    query?: string;
    list?: string;
    refresh?: boolean;
  }) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (opts?.query?.trim()) params.set("q", opts.query.trim());
      if (opts?.list?.trim()) params.set("list", opts.list.trim());
      if (opts?.refresh) params.set("refresh", "1");
      const res = await fetch(`/api/game-knowledge/afs?${params}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as IndexResponse;
      if (!res.ok) {
        throw new Error(data.error || "No pude cargar el conocimiento de AFS.");
      }
      setMeta(data);
      setItems(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pude cargar el conocimiento de AFS."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    void loadIndex();
  }, [allowed, loadIndex]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setOpenId(null);
    setOpenBody("");
    await loadIndex({ query: q, list });
  }

  async function onSync() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch("/api/game-knowledge/afs", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "No pude actualizar el Trello.");
      }
      await loadIndex({ query: q, list });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pude actualizar el Trello."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function toggleOpen(item: KnowledgeItem) {
    if (openId === item.id) {
      setOpenId(null);
      setOpenBody("");
      return;
    }
    setOpenId(item.id);
    setOpenBody("");
    setOpenLoading(true);
    try {
      const res = await fetch(
        `/api/game-knowledge/afs?id=${encodeURIComponent(item.id)}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as ChunkResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "No pude abrir esa entrada.");
      }
      setOpenBody(data.chunk?.body || "(sin detalle)");
    } catch (err) {
      setOpenBody(
        err instanceof Error ? err.message : "No pude abrir esa entrada."
      );
    } finally {
      setOpenLoading(false);
    }
  }

  if (allowed === null) {
    return (
      <AppShell title="Conocimiento AFS" backHref="/profile">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="Conocimiento AFS" backHref="/profile">
        <p className="muted">Redirigiendo…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Conocimiento AFS" backHref="/profile">
      <p className="muted">
        Todo el board oficial de Anime Fighting Simulator. La IA usa trozos
        relevantes al generar enfoques y guías.
      </p>

      {meta ? (
        <p className="idea-meta">
          {meta.chunkCount} entradas · sync {formatSyncedAt(meta.syncedAt)} ·{" "}
          <a
            href={meta.boardUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Trello
          </a>
        </p>
      ) : null}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void onSync()}
          disabled={syncing || loading}
        >
          {syncing ? "Actualizando…" : "Actualizar desde Trello"}
        </button>
        <Link href="/profile/juegos" className="text-link">
          Ficha del juego
        </Link>
      </div>

      <form onSubmit={(e) => void onSearch(e)}>
        <label className="field-label" htmlFor="afs-q">
          Buscar
        </label>
        <input
          id="afs-q"
          className="field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej. Susanoo, Torre, codes, Jeju…"
        />

        <label className="field-label" htmlFor="afs-list">
          Lista
        </label>
        <select
          id="afs-list"
          className="field"
          value={list}
          onChange={(e) => setList(e.target.value)}
        >
          <option value="">Todas</option>
          {(meta?.lists || []).map((l) => (
            <option key={l.name} value={l.name}>
              {l.name} ({l.count})
            </option>
          ))}
        </select>

        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <p className="muted">No hay resultados. Prueba otra búsqueda o actualiza el Trello.</p>
      ) : null}

      <ul className="settings-list" aria-label="Entradas AFS">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="settings-row"
              onClick={() => void toggleOpen(item)}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div>
                <p className="settings-title">{item.title}</p>
                <p className="settings-desc">
                  {item.list}
                  {item.preview ? ` · ${item.preview}` : ""}
                </p>
              </div>
              <span className="chevron" aria-hidden>
                {openId === item.id ? "▾" : "→"}
              </span>
            </button>
            {openId === item.id ? (
              <div className="section" style={{ paddingTop: 0 }}>
                {openLoading ? (
                  <p className="muted">Cargando…</p>
                ) : (
                  <pre
                    className="field"
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      minHeight: "4rem",
                    }}
                  >
                    {openBody}
                  </pre>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

export default function AfsKnowledgePage() {
  return (
    <RequireOnboarding>
      <AfsKnowledgeBrowser />
    </RequireOnboarding>
  );
}
