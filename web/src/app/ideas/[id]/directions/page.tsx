"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  isUsageLimitPayload,
  UpgradePrompt,
} from "@/components/UpgradePrompt";
import { applyGenerationBilling } from "@/lib/apply-generation-billing";
import { createId } from "@/lib/id";
import { ideaPreview } from "@/lib/idea-preview";
import { trackFunnel } from "@/lib/metrics";
import { aiResponseError, safeAiJson } from "@/lib/fetch-ai-json";
import { ideaAiContext } from "@/lib/idea-ai-context";
import { buildUnifiedScript } from "@/lib/script";
import { getIdea, upsertIdea } from "@/lib/storage";
import type { Direction, Idea, ScriptBlock, VideoMode } from "@/lib/types";

function ideaVideoMode(idea: Idea): VideoMode {
  return idea.videoMode === "long" ? "long" : "short";
}

function DirectionsFlow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [failedDirection, setFailedDirection] = useState<Direction | null>(
    null
  );
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const autoStartedRef = useRef<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const found = getIdea(id);
    if (!found) {
      router.replace("/ideas");
      return;
    }
    setIdea(found);
  }, [id, router]);

  async function generateDirections(force = false, base?: Idea) {
    const current = base ?? idea;
    if (!current) return;
    if (current.directions?.length && !force) return;
    if (generatingRef.current) return;

    generatingRef.current = true;
    setLoading(true);
    setDirectionsError("");
    setDraftError("");
    setFailedDirection(null);
    setNeedsUpgrade(false);
    try {
      const res = await fetch("/api/generate-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: current.rawText,
          profileContext: ideaAiContext(current),
          videoMode: ideaVideoMode(current),
        }),
      });
      const data = await safeAiJson(res);
      if (!res.ok) {
        if (res.status === 402 || isUsageLimitPayload(data)) {
          setNeedsUpgrade(true);
          trackFunnel("hit_limit");
        }
        throw new Error(aiResponseError(data));
      }
      void applyGenerationBilling(
        data && typeof data === "object" && "billing" in data
          ? (data as { billing: Parameters<typeof applyGenerationBilling>[0] })
              .billing
          : undefined
      );
      const rawDirs =
        data &&
        typeof data === "object" &&
        "directions" in data &&
        Array.isArray((data as { directions: unknown }).directions)
          ? (data as { directions: Array<Omit<Direction, "id">> }).directions
          : [];
      const directions: Direction[] = rawDirs.map((d) => ({
        ...d,
        id: createId("dir"),
      }));
      trackFunnel("directions_generated");
      const latest = getIdea(current.id) ?? current;
      const next: Idea = {
        ...latest,
        directions,
        updatedAt: new Date().toISOString(),
      };
      // Al regenerar, limpia selección vieja (IDs nuevos) para no revisar con ángulo incorrecto
      if (force) {
        delete next.selectedDirectionId;
        delete next.directionAdjustment;
        delete next.draft;
        if (latest.status === "in_progress" || latest.status === "ready") {
          next.status = "captured";
        }
      }
      upsertIdea(next);
      if (aliveRef.current) setIdea(next);
    } catch (e) {
      if (aliveRef.current) {
        setDirectionsError(
          e instanceof Error
            ? e.message
            : "No pude armar buenos enfoques. Intenta de nuevo."
        );
      }
    } finally {
      generatingRef.current = false;
      if (aliveRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!idea) return;
    if (idea.directions?.length) return;
    if (autoStartedRef.current === idea.id) return;
    autoStartedRef.current = idea.id;
    void generateDirections(false, idea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id, idea?.directions?.length]);

  async function selectDirection(selected: Direction) {
    if (!idea || creatingId) return;
    setCreatingId(selected.id);
    setDraftError("");
    setDirectionsError("");
    setFailedDirection(null);
    setNeedsUpgrade(false);
    const videoMode = ideaVideoMode(idea);
    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: idea.rawText,
          profileContext: ideaAiContext(idea),
          direction: selected,
          videoMode,
        }),
      });
      const data = await safeAiJson(res);
      if (!res.ok) {
        if (res.status === 402 || isUsageLimitPayload(data)) {
          setNeedsUpgrade(true);
          trackFunnel("hit_limit");
        }
        throw new Error(aiResponseError(data));
      }
      void applyGenerationBilling(
        data && typeof data === "object" && "billing" in data
          ? (data as { billing: Parameters<typeof applyGenerationBilling>[0] })
              .billing
          : undefined
      );
      const draftPayload =
        data && typeof data === "object" && "draft" in data
          ? (
              data as {
                draft?: {
                  hook?: string;
                  scriptBody?: string;
                  closing?: string;
                  estimatedSeconds?: number;
                  blocks?: ScriptBlock[];
                };
              }
            ).draft
          : undefined;
      if (!draftPayload?.hook?.trim()) {
        throw new Error("La guía llegó incompleta. Intenta de nuevo.");
      }
      const blocks = Array.isArray(draftPayload.blocks)
        ? draftPayload.blocks.filter((b) => b?.title?.trim() && b?.body?.trim())
        : undefined;
      if (videoMode === "long") {
        if (!blocks?.length) {
          throw new Error("La guía llegó incompleta. Intenta de nuevo.");
        }
      } else if (!draftPayload.scriptBody?.trim()) {
        throw new Error("La guía llegó incompleta. Intenta de nuevo.");
      }
      trackFunnel("draft_ready");
      const now = new Date().toISOString();
      const latest = getIdea(idea.id) ?? idea;
      const draft = {
        format: "guide" as const,
        hook: draftPayload.hook,
        scriptBody:
          draftPayload.scriptBody ||
          (blocks ? blocks.map((b) => b.body).join("\n\n") : ""),
        closing: draftPayload.closing || "",
        beats: [],
        ...(blocks?.length ? { blocks } : {}),
        estimatedSeconds: draftPayload.estimatedSeconds || 45,
        creatorScript: "",
        updatedAt: now,
      };
      draft.creatorScript = buildUnifiedScript(draft);
      const next: Idea = {
        ...latest,
        status: "in_progress",
        selectedDirectionId: selected.id,
        directions: latest.directions ?? idea.directions,
        draft,
        updatedAt: now,
      };
      upsertIdea(next);
      router.push(`/ideas/${idea.id}/draft`);
    } catch (e) {
      if (aliveRef.current) {
        setDraftError(
          e instanceof Error
            ? e.message
            : "No pude crear la guía. Intenta de nuevo."
        );
        setFailedDirection(selected);
        setCreatingId(null);
      }
    }
  }

  if (!idea) {
    return (
      <AppShell backHref="/ideas">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  const isCreating = Boolean(creatingId);
  const cardsBusy = loading || isCreating;
  const isLong = ideaVideoMode(idea) === "long";

  return (
    <AppShell title="Enfoques" backHref={`/ideas/${id}`}>
      <p className="idea-snippet">{ideaPreview(idea.rawText, 120)}</p>
      {isLong ? (
        <p className="muted">Direcciones para tu video largo de YouTube.</p>
      ) : null}

      {loading ? (
        <p className="muted" aria-live="polite" aria-busy="true">
          Armando enfoques…
        </p>
      ) : null}

      {isCreating ? (
        <p className="muted" aria-live="polite" aria-busy="true">
          Creando guía…
        </p>
      ) : null}

      {needsUpgrade ? (
        <UpgradePrompt message={directionsError || draftError} />
      ) : null}

      {directionsError && !needsUpgrade ? (
        <div className="error-box" role="alert">
          <p className="error">{directionsError}</p>
          <button
            type="button"
            className="btn-secondary btn-block"
            onClick={() => generateDirections(true, idea)}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {draftError && !needsUpgrade ? (
        <div className="error-box" role="alert">
          <p className="error">{draftError}</p>
          {failedDirection ? (
            <button
              type="button"
              className="btn-secondary btn-block"
              onClick={() => selectDirection(failedDirection)}
            >
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className="stack"
        aria-busy={cardsBusy}
        aria-disabled={cardsBusy}
      >
        {idea.directions?.map((dir) => (
          <article key={dir.id} className="direction-card">
            <h2 className="direction-name">{dir.name}</h2>
            <p className="muted">{dir.promise}</p>
            <p>{dir.hook}</p>
            <button
              type="button"
              className="btn-primary btn-block"
              disabled={cardsBusy}
              onClick={() => selectDirection(dir)}
            >
              {creatingId === dir.id ? "Creando…" : "Elegir"}
            </button>
          </article>
        ))}
      </div>

      {!loading && !isCreating && idea.directions?.length ? (
        <button
          type="button"
          className="text-link"
          onClick={() => {
            if (
              idea.draft &&
              !window.confirm(
                "¿Generar otros enfoques? Se descartará la guía actual."
              )
            ) {
              return;
            }
            void generateDirections(true, idea);
          }}
        >
          Otros enfoques
        </button>
      ) : null}
    </AppShell>
  );
}

export default function DirectionsPage() {
  return (
    <RequireOnboarding>
      <DirectionsFlow />
    </RequireOnboarding>
  );
}
