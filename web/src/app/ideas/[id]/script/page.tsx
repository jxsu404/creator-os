"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { YoutubePackagePanel } from "@/components/YoutubePackagePanel";
import {
  profileContextFor,
  withUser1Defaults,
} from "@/lib/profile-context";
import { trackFunnel } from "@/lib/metrics";
import { buildUnifiedScript } from "@/lib/script";
import { getIdea, getProfile, upsertIdea } from "@/lib/storage";
import type { Idea, YoutubeUploadPackage } from "@/lib/types";

const ARCHIVE_CONFIRM =
  "¿Archivar esta idea? Dejará de verse en Inicio e Ideas.";

function ScriptEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [statusNote, setStatusNote] = useState("");
  const saveTimer = useRef<number | null>(null);
  const savedLabelTimer = useRef<number | null>(null);
  const ideaRef = useRef<Idea | null>(null);

  useEffect(() => {
    const found = getIdea(id);
    if (!found?.draft) {
      router.replace(`/ideas/${id}`);
      return;
    }
    const draft = found.draft;
    const creatorScript =
      draft.creatorScript?.trim() || buildUnifiedScript(draft);
    if (creatorScript !== draft.creatorScript) {
      const synced: Idea = {
        ...found,
        draft: { ...draft, format: "guide", creatorScript },
      };
      upsertIdea(synced);
      ideaRef.current = synced;
      setIdea(synced);
    } else {
      ideaRef.current = found;
      setIdea(found);
    }
    // Lista / grabada: lectura con acciones. Resto: guion visible de entrada.
    setEditing(false);
  }, [id, router]);

  useEffect(() => {
    return () => {
      // Flush pendiente: sin esto, salir en <350ms pierde el texto
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (ideaRef.current) upsertIdea(ideaRef.current);
      }
      if (savedLabelTimer.current) {
        window.clearTimeout(savedLabelTimer.current);
        savedLabelTimer.current = null;
      }
    };
  }, []);

  if (!idea?.draft) {
    return (
      <AppShell backHref={`/ideas/${id}/draft`} backLabel="Volver a la guía">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  function commit(next: Idea) {
    upsertIdea(next);
    ideaRef.current = next;
    setIdea(next);
    setSaveState("saved");
    if (savedLabelTimer.current) window.clearTimeout(savedLabelTimer.current);
    savedLabelTimer.current = window.setTimeout(() => setSaveState("idle"), 1600);
  }

  function setStatus(
    status: Idea["status"],
    opts?: { bannerKey?: string; confirm?: string }
  ) {
    if (opts?.confirm && !window.confirm(opts.confirm)) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const current = ideaRef.current ?? idea!;
    const now = new Date().toISOString();
    const next: Idea = {
      ...current,
      status,
      updatedAt: now,
      draft: current.draft
        ? { ...current.draft, format: "guide", updatedAt: now }
        : current.draft,
    };
    upsertIdea(next);
    if (status === "ready") {
      trackFunnel("marked_ready");
    }
    if (opts?.bannerKey) {
      try {
        sessionStorage.setItem(opts.bannerKey, "1");
      } catch {
        /* ignore */
      }
    }
    router.push("/ideas");
  }

  function scheduleCreatorScript(value: string) {
    const current = ideaRef.current;
    if (!current?.draft) return;
    setSaveState("saving");
    const now = new Date().toISOString();
    const demoted =
      current.status === "ready" || current.status === "recorded";
    const next: Idea = {
      ...current,
      draft: {
        ...current.draft,
        format: "guide",
        creatorScript: value,
        updatedAt: now,
      },
      updatedAt: now,
      status: demoted ? "in_progress" : current.status,
    };
    if (demoted) {
      setStatusNote("Volvió a borrador — marca Listo para grabar cuando termines.");
    }
    ideaRef.current = next;
    setIdea(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (ideaRef.current) commit(ideaRef.current);
    }, 350);
  }

  function saveYoutubePackage(pkg: YoutubeUploadPackage) {
    const current = ideaRef.current ?? idea;
    if (!current) return;
    const next: Idea = {
      ...current,
      youtubePackage: pkg,
      updatedAt: new Date().toISOString(),
    };
    commit(next);
  }

  const creatorScript = idea.draft.creatorScript || buildUnifiedScript(idea.draft);
  const isReady = idea.status === "ready";
  const isRecorded = idea.status === "recorded";
  const profile = getProfile();
  const aiContext = profile
    ? profileContextFor(withUser1Defaults(profile), {
        gameId: idea.gameId,
        contentAngle: idea.contentAngle,
      })
    : "";

  const youtubePanel = (
    <details className="yt-pack-details">
      <summary className="text-link">Paquete para YouTube (opcional)</summary>
      <YoutubePackagePanel
        idea={idea}
        script={creatorScript}
        profileContext={aiContext}
        onSave={saveYoutubePackage}
      />
    </details>
  );

  const backHref = isReady || isRecorded ? "/ideas" : `/ideas/${id}/draft`;
  const backLabel = isReady || isRecorded ? "Volver a Ideas" : "Volver a la guía";

  return (
    <AppShell title="Guion" backHref={backHref} backLabel={backLabel}>
      <div className="draft-meta">
        <span className="save-indicator" aria-live="polite">
          {saveState === "saving"
            ? "Guardando…"
            : saveState === "saved"
              ? "Guardado"
              : ""}
        </span>
      </div>

      {statusNote ? (
        <p className="muted" role="status">
          {statusNote}
        </p>
      ) : null}

      {isReady && !editing ? (
        <>
          <textarea
            id="creator-script-ready"
            className="field field-lg"
            rows={12}
            value={creatorScript}
            onChange={(e) => {
              setEditing(true);
              scheduleCreatorScript(e.target.value);
            }}
            aria-label="Guion"
          />
          {youtubePanel}
          <div className="sticky-actions">
            <button
              type="button"
              className="btn-primary btn-block"
              onClick={() =>
                setStatus("recorded", { bannerKey: "creatoros_recorded_banner" })
              }
            >
              Ya lo grabé
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => setEditing(true)}
            >
              Editar guion
            </button>
            <Link href={`/ideas/${id}/draft`} className="text-link">
              Ajustes IA
            </Link>
            <button
              type="button"
              className="btn-danger"
              onClick={() =>
                setStatus("archived", {
                  confirm: ARCHIVE_CONFIRM,
                })
              }
            >
              Archivar
            </button>
          </div>
        </>
      ) : isRecorded && !editing ? (
        <>
          <pre className="preview-plain">{creatorScript}</pre>
          {youtubePanel}
          <div className="sticky-actions">
            <button
              type="button"
              className="btn-primary btn-block"
              onClick={() => router.push("/")}
            >
              Inicio
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => setStatus("ready")}
            >
              Volver a lista
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => setEditing(true)}
            >
              Editar guion
            </button>
          </div>
        </>
      ) : (
        <>
          <textarea
            id="creator-script"
            className="field field-lg"
            rows={14}
            value={creatorScript}
            onChange={(e) => scheduleCreatorScript(e.target.value)}
            autoFocus={editing}
            aria-label="Guion"
          />
          {youtubePanel}
          <div className="sticky-actions">
            <button
              type="button"
              className="btn-primary btn-block"
              onClick={() =>
                setStatus("ready", { bannerKey: "creatoros_ready_banner" })
              }
            >
              Listo para grabar
            </button>
            <Link href={`/ideas/${id}/draft`} className="text-link">
              Ajustes IA
            </Link>
            {(isReady || isRecorded) && editing ? (
              <button
                type="button"
                className="text-link"
                onClick={() => setEditing(false)}
              >
                Listo
              </button>
            ) : null}
            <button
              type="button"
              className="btn-danger"
              onClick={() =>
                setStatus("archived", {
                  confirm: ARCHIVE_CONFIRM,
                })
              }
            >
              Archivar
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

export default function ScriptPage() {
  return (
    <RequireOnboarding>
      <ScriptEditor />
    </RequireOnboarding>
  );
}
