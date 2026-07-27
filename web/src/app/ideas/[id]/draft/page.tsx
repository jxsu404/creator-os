"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  isUsageLimitPayload,
  UpgradePrompt,
} from "@/components/UpgradePrompt";
import { trackFunnel } from "@/lib/metrics";
import { profileContextFor } from "@/lib/profile-context";
import { buildUnifiedScript } from "@/lib/script";
import { getIdea, getProfile, upsertIdea } from "@/lib/storage";
import type { Direction, Idea } from "@/lib/types";

function ideaAiContext(idea: Idea) {
  const profile = getProfile();
  if (!profile) return "";
  return profileContextFor(profile, {
    gameId: idea.gameId,
    contentAngle: idea.contentAngle,
  });
}

function DraftPreview() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [revising, setRevising] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const ideaRef = useRef<Idea | null>(null);

  useEffect(() => {
    const found = getIdea(id);
    if (!found?.draft) {
      router.replace(`/ideas/${id}`);
      return;
    }
    ideaRef.current = found;
    setIdea(found);
    try {
      const stored = sessionStorage.getItem(`creatoros_preview_open_${id}`);
      if (stored === "0") setPreviewOpen(false);
      if (stored === "1") setPreviewOpen(true);
    } catch {
      /* ignore */
    }
  }, [id, router]);

  function togglePreview() {
    setPreviewOpen((open) => {
      const next = !open;
      try {
        sessionStorage.setItem(
          `creatoros_preview_open_${id}`,
          next ? "1" : "0"
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  if (!idea?.draft) {
    return (
      <AppShell backHref="/ideas">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  function selectedDirection(): Direction | null {
    const current = ideaRef.current ?? idea;
    if (!current?.directions?.length) return null;
    return (
      current.directions.find((d) => d.id === current.selectedDirectionId) ||
      current.directions[0]
    );
  }

  async function applyAdjustments() {
    const current = ideaRef.current ?? idea;
    const direction = selectedDirection();
    if (!current?.draft || !direction || !adjustment.trim() || revising) return;

    setRevising(true);
    setReviseError("");
    setNeedsUpgrade(false);
    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: current.rawText,
          profileContext: ideaAiContext(current),
          direction,
          adjustment: adjustment.trim(),
          currentDraft: {
            hook: current.draft.hook,
            scriptBody: current.draft.scriptBody,
            closing: current.draft.closing,
            estimatedSeconds: current.draft.estimatedSeconds,
            creatorScript:
              current.draft.creatorScript || buildUnifiedScript(current.draft),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || isUsageLimitPayload(data)) {
          setNeedsUpgrade(true);
          trackFunnel("hit_limit");
        }
        throw new Error(data.error || "Error");
      }
      const draftPayload = data.draft;
      if (!draftPayload?.hook?.trim() || !draftPayload?.scriptBody?.trim()) {
        throw new Error("La guía llegó incompleta. Intenta de nuevo.");
      }
      const now = new Date().toISOString();
      const revised = {
        format: "guide" as const,
        hook: draftPayload.hook,
        scriptBody: draftPayload.scriptBody,
        closing: draftPayload.closing || "",
        beats: [],
        estimatedSeconds: draftPayload.estimatedSeconds || 45,
        updatedAt: now,
        creatorScript: "",
      };
      revised.creatorScript = buildUnifiedScript(revised);
      const latest = getIdea(current.id) ?? current;
      const next: Idea = {
        ...latest,
        status: "in_progress",
        directionAdjustment: adjustment.trim(),
        draft: revised,
        updatedAt: now,
      };
      upsertIdea(next);
      ideaRef.current = next;
      setIdea(next);
      setAdjustment("");
      setPreviewOpen(true);
      try {
        sessionStorage.setItem(`creatoros_preview_open_${id}`, "1");
      } catch {
        /* ignore */
      }
    } catch (e) {
      setReviseError(
        e instanceof Error
          ? e.message
          : "No pude aplicar los ajustes. Intenta de nuevo."
      );
    } finally {
      setRevising(false);
    }
  }

  function continueToScript() {
    const current = ideaRef.current ?? idea!;
    if (!current.draft) return;
    const now = new Date().toISOString();
    const creatorScript =
      current.draft.creatorScript?.trim() ||
      buildUnifiedScript(current.draft);
    const next: Idea = {
      ...current,
      draft: {
        ...current.draft,
        format: "guide",
        creatorScript,
        updatedAt: now,
      },
      updatedAt: now,
    };
    upsertIdea(next);
    router.push(`/ideas/${id}/script`);
  }

  const { draft } = idea;

  return (
    <AppShell title="Guía" backHref={`/ideas/${id}`}>
      <div className="draft-meta">
        <span className="idea-meta">~{draft.estimatedSeconds}s</span>
        <span className="save-indicator" aria-live="polite">
          {revising ? "Ajustando…" : ""}
        </span>
      </div>

      <section className={previewOpen ? "block" : "block block-collapsed"}>
        <div className="preview-header">
          <h2 className="section-title">Vista previa</h2>
          <button
            type="button"
            className="text-link"
            onClick={togglePreview}
            aria-expanded={previewOpen}
          >
            {previewOpen ? "Cerrar" : "Abrir"}
          </button>
        </div>

        {previewOpen ? (
          <div className="preview-body">
            <p className="preview-plain">
              <strong>Gancho</strong>
              {"\n"}
              {draft.hook || "—"}
            </p>
            <p className="preview-plain">
              <strong>Guion</strong>
              {"\n"}
              {draft.scriptBody || "—"}
            </p>
            <p className="preview-plain">
              <strong>Cierre</strong>
              {"\n"}
              {draft.closing || "—"}
            </p>
          </div>
        ) : null}
      </section>

      <label className="field-label" htmlFor="adj">
        Ajustar
      </label>
      <textarea
        id="adj"
        className="field"
        rows={2}
        placeholder="Qué cambiar…"
        value={adjustment}
        onChange={(e) => setAdjustment(e.target.value)}
        disabled={revising}
      />
      {needsUpgrade ? <UpgradePrompt message={reviseError} /> : null}
      {reviseError && !needsUpgrade ? (
        <p className="error">{reviseError}</p>
      ) : null}
      {adjustment.trim() ? (
        <button
          type="button"
          className="btn-secondary btn-block"
          disabled={revising}
          onClick={applyAdjustments}
        >
          {revising ? "Reescribiendo…" : "Aplicar"}
        </button>
      ) : null}

      <div className="sticky-actions">
        <button
          type="button"
          className="btn-primary btn-block"
          disabled={revising}
          onClick={continueToScript}
        >
          Continuar
        </button>
        <Link href={`/ideas/${id}/directions`} className="text-link">
          Cambiar enfoque
        </Link>
      </div>
    </AppShell>
  );
}

export default function DraftPage() {
  return (
    <RequireOnboarding>
      <DraftPreview />
    </RequireOnboarding>
  );
}
