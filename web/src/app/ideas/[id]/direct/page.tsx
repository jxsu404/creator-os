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
import { aiResponseError, safeAiJson } from "@/lib/fetch-ai-json";
import { ideaAiContextWithKnowledge } from "@/lib/idea-ai-context";
import { isDirectScriptFlow } from "@/lib/idea-flow";
import { ideaPreview } from "@/lib/idea-preview";
import { trackFunnel } from "@/lib/metrics";
import { buildUnifiedScript } from "@/lib/script";
import { getIdea, upsertIdea } from "@/lib/storage";
import type { Idea, ScriptBlock, VideoMode } from "@/lib/types";

function ideaVideoMode(idea: Idea): VideoMode {
  return idea.videoMode === "long" ? "long" : "short";
}

function DirectDraftFlow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
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
    if (!isDirectScriptFlow(found)) {
      router.replace(`/ideas/${id}/directions`);
      return;
    }
    if (found.draft) {
      router.replace(`/ideas/${id}/draft`);
      return;
    }
    setIdea(found);
  }, [id, router]);

  async function generateDirect(base?: Idea) {
    const current = base ?? idea;
    if (!current || generatingRef.current) return;
    if (current.draft) {
      router.replace(`/ideas/${current.id}/draft`);
      return;
    }

    generatingRef.current = true;
    setLoading(true);
    setError("");
    setNeedsUpgrade(false);
    const videoMode = ideaVideoMode(current);

    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: current.rawText,
          profileContext: await ideaAiContextWithKnowledge(current),
          videoMode,
          directFromIdea: true,
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

      trackFunnel("draft_ready", { flow: "direct" });
      const now = new Date().toISOString();
      const latest = getIdea(current.id) ?? current;
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
        ideaFlow: "direct",
        draft,
        updatedAt: now,
      };
      upsertIdea(next);
      router.replace(`/ideas/${current.id}/draft`);
    } catch (e) {
      if (aliveRef.current) {
        setError(
          e instanceof Error
            ? e.message
            : "No pude crear el guion. Intenta de nuevo."
        );
        setLoading(false);
      }
    } finally {
      generatingRef.current = false;
    }
  }

  useEffect(() => {
    if (!idea) return;
    if (idea.draft) return;
    if (autoStartedRef.current === idea.id) return;
    autoStartedRef.current = idea.id;
    void generateDirect(idea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id]);

  if (!idea) {
    return (
      <AppShell backHref="/guion" backLabel="Volver a Nuevo guion">
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tu guion" backHref={`/ideas/${id}`}>
      <p className="idea-snippet">{ideaPreview(idea.rawText, 140)}</p>

      {loading ? (
        <p className="muted" aria-live="polite" aria-busy="true">
          Armando tu guía sin cambiar el enfoque…
        </p>
      ) : null}

      {needsUpgrade ? <UpgradePrompt message={error} /> : null}

      {error && !needsUpgrade ? (
        <div className="error-box" role="alert">
          <p className="error">{error}</p>
          <button
            type="button"
            className="btn-secondary btn-block"
            onClick={() => {
              autoStartedRef.current = null;
              void generateDirect(idea);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function DirectDraftPage() {
  return (
    <RequireOnboarding>
      <DirectDraftFlow />
    </RequireOnboarding>
  );
}
