"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { YoutubePackagePanel } from "@/components/YoutubePackagePanel";
import { ideaAiContext, ideaAiContextWithKnowledge } from "@/lib/idea-ai-context";
import { ideaTitle } from "@/lib/idea-title";
import { trackFunnel } from "@/lib/metrics";
import { saveTextAsNote } from "@/lib/notes";
import { buildUnifiedScript } from "@/lib/script";
import { getIdea, upsertIdea } from "@/lib/storage";
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
  const [noteSavedId, setNoteSavedId] = useState<string | null>(null);
  const [aiContext, setAiContext] = useState("");
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
    if (!idea) return;
    const snapshot = idea;
    setAiContext(ideaAiContext(snapshot));
    let cancelled = false;
    void ideaAiContextWithKnowledge(snapshot).then((ctx) => {
      if (!cancelled) setAiContext(ctx);
    });
    return () => {
      cancelled = true;
    };
    // Solo re-enriquece si cambia el texto/juego (no en cada tecla del guion).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id, idea?.rawText, idea?.gameId, idea?.contentAngle]);

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
        ? {
            ...current.draft,
            format: "guide",
            creatorScript:
              current.draft.creatorScript?.trim() ||
              buildUnifiedScript(current.draft),
            updatedAt: now,
          }
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

  function persistDraft(nextDraft: NonNullable<Idea["draft"]>) {
    const current = ideaRef.current;
    if (!current?.draft) return;
    setSaveState("saving");
    const now = new Date().toISOString();
    const demoted =
      current.status === "ready" || current.status === "recorded";
    const next: Idea = {
      ...current,
      draft: { ...nextDraft, format: "guide", updatedAt: now },
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

  function scheduleStructuredUpdate(
    patch: Partial<Pick<NonNullable<Idea["draft"]>, "hook" | "closing" | "blocks">>
  ) {
    const current = ideaRef.current;
    if (!current?.draft) return;
    const nextDraft = {
      ...current.draft,
      ...patch,
    };
    if (nextDraft.blocks?.length) {
      nextDraft.scriptBody = nextDraft.blocks.map((b) => b.body).join("\n\n");
    }
    nextDraft.creatorScript = buildUnifiedScript(nextDraft);
    persistDraft(nextDraft);
  }

  function scheduleCreatorScript(value: string) {
    const current = ideaRef.current;
    if (!current?.draft) return;
    persistDraft({
      ...current.draft,
      creatorScript: value,
    });
  }

  function updateBlock(index: number, field: "title" | "body", value: string) {
    const current = ideaRef.current;
    if (!current?.draft?.blocks) return;
    const blocks = current.draft.blocks.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    scheduleStructuredUpdate({ blocks });
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

  function saveThumbnail(thumbnailUrl: string) {
    const current = ideaRef.current ?? idea;
    if (!current) return;
    const next: Idea = {
      ...current,
      thumbnailUrl,
      updatedAt: new Date().toISOString(),
    };
    commit(next);
  }

  function saveScriptToNotes() {
    const current = ideaRef.current ?? idea;
    if (!current?.draft) return;
    const text =
      current.draft.creatorScript?.trim() ||
      buildUnifiedScript(current.draft);
    if (!text.trim()) return;
    const note = saveTextAsNote({
      body: text,
      title: ideaTitle(current, 80),
      sourceIdeaId: current.id,
    });
    setNoteSavedId(note.id);
    setStatusNote("Guion copiado a Notas.");
  }

  const creatorScript = idea.draft.creatorScript || buildUnifiedScript(idea.draft);
  const isReady = idea.status === "ready";
  const isRecorded = idea.status === "recorded";
  const hasBlocks = Boolean(idea.draft.blocks?.length);
  const showBlockEditor = hasBlocks && (!(isReady || isRecorded) || editing);

  const youtubePanel = (
    <details className="yt-pack-details">
      <summary className="text-link">Paquete para YouTube (opcional)</summary>
      <YoutubePackagePanel
        idea={idea}
        script={creatorScript}
        profileContext={aiContext}
        onSave={saveYoutubePackage}
        onThumbnail={saveThumbnail}
      />
    </details>
  );

  const backHref = isReady || isRecorded ? "/ideas" : `/ideas/${id}/draft`;
  const backLabel = isReady || isRecorded ? "Volver a Ideas" : "Volver a la guía";

  const blockEditor = hasBlocks ? (
    <div className="stack" style={{ padding: "var(--space-2)" }}>
      <label className="field-label" htmlFor="long-hook">
        Gancho
      </label>
      <textarea
        id="long-hook"
        className="field"
        rows={3}
        value={idea.draft.hook}
        onChange={(e) => scheduleStructuredUpdate({ hook: e.target.value })}
        aria-label="Gancho"
      />
      {idea.draft.blocks!.map((block, i) => (
        <div key={block.id || i} className="script-block-edit">
          <label className="field-label" htmlFor={`block-title-${i}`}>
            Bloque {i + 1}
          </label>
          <input
            id={`block-title-${i}`}
            className="field script-block-title-field"
            value={block.title}
            onChange={(e) => updateBlock(i, "title", e.target.value)}
            aria-label={`Título del bloque ${i + 1}`}
          />
          <textarea
            id={`block-body-${i}`}
            className="field"
            rows={6}
            value={block.body}
            onChange={(e) => updateBlock(i, "body", e.target.value)}
            aria-label={`Guion del bloque ${i + 1}`}
          />
        </div>
      ))}
      <label className="field-label" htmlFor="long-closing">
        Cierre
      </label>
      <textarea
        id="long-closing"
        className="field"
        rows={3}
        value={idea.draft.closing}
        onChange={(e) => scheduleStructuredUpdate({ closing: e.target.value })}
        aria-label="Cierre"
      />
    </div>
  ) : null;

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
          {noteSavedId ? (
            <>
              {" "}
              <Link href={`/notas/${noteSavedId}`} className="inline-link">
                Abrir nota
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {isReady && !editing ? (
        <>
          {hasBlocks ? (
            <pre className="preview-plain">{creatorScript}</pre>
          ) : (
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
          )}
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
              className="text-link"
              onClick={saveScriptToNotes}
            >
              Guardar en notas
            </button>
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
            <button
              type="button"
              className="text-link"
              onClick={saveScriptToNotes}
            >
              Guardar en notas
            </button>
          </div>
        </>
      ) : (
        <>
          {showBlockEditor ? blockEditor : null}
          {!hasBlocks ? (
            <textarea
              id="creator-script"
              className="field field-lg"
              rows={14}
              value={creatorScript}
              onChange={(e) => scheduleCreatorScript(e.target.value)}
              autoFocus={editing}
              aria-label="Guion"
            />
          ) : null}
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
            <button
              type="button"
              className="text-link"
              onClick={saveScriptToNotes}
            >
              Guardar en notas
            </button>
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
