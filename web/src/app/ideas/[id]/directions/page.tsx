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

function DirectionsFlow() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    setNeedsUpgrade(false);
    try {
      const res = await fetch("/api/generate-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: current.rawText,
          profileContext: ideaAiContext(current),
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
      void applyGenerationBilling(data.billing);
      const directions: Direction[] = data.directions.map(
        (d: Omit<Direction, "id">) => ({
          ...d,
          id: createId("dir"),
        })
      );
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
        setError(
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
    setError("");
    setNeedsUpgrade(false);
    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: idea.rawText,
          profileContext: ideaAiContext(idea),
          direction: selected,
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
      void applyGenerationBilling(data.billing);
      const draftPayload = data.draft;
      if (
        !draftPayload?.hook?.trim() ||
        !draftPayload?.scriptBody?.trim() ||
        !Array.isArray(draftPayload.beats) ||
        draftPayload.beats.length === 0
      ) {
        throw new Error("La guía llegó incompleta. Intenta de nuevo.");
      }
      trackFunnel("draft_ready");
      const now = new Date().toISOString();
      const latest = getIdea(idea.id) ?? idea;
      const draft = {
        format: "guide" as const,
        hook: draftPayload.hook,
        scriptBody: draftPayload.scriptBody,
        closing: draftPayload.closing || "",
        beats: draftPayload.beats,
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
        setError(
          e instanceof Error
            ? e.message
            : "No pude crear la guía. Intenta de nuevo."
        );
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

  return (
    <AppShell title="Enfoques" backHref={`/ideas/${id}`}>
      <p className="idea-snippet">{ideaPreview(idea.rawText, 120)}</p>

      {loading ? (
        <p className="muted">Armando enfoques…</p>
      ) : null}

      {creatingId ? <p className="muted">Creando guía…</p> : null}

      {needsUpgrade ? <UpgradePrompt message={error} /> : null}

      {error && !needsUpgrade ? (
        <div className="error-box">
          <p className="error">{error}</p>
          <button
            type="button"
            className="btn-secondary btn-block"
            onClick={() => generateDirections(true, idea)}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="stack">
        {idea.directions?.map((dir) => (
          <article key={dir.id} className="direction-card">
            <h2 className="direction-name">{dir.name}</h2>
            <p className="muted">{dir.promise}</p>
            <p>{dir.hook}</p>
            <button
              type="button"
              className="btn-primary btn-block"
              disabled={loading || Boolean(creatingId)}
              onClick={() => selectDirection(dir)}
            >
              {creatingId === dir.id ? "Creando…" : "Elegir"}
            </button>
          </article>
        ))}
      </div>

      {!loading && !creatingId && idea.directions?.length ? (
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
