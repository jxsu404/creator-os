import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import {
  buildLongDraftPrompt,
  IDEA_TOO_THIN_FOR_LONG_MESSAGE,
  isIdeaTooThinForLongPayload,
  validateLongDraft,
} from "@/lib/long-generation";
import {
  buildDraftPrompt,
  isTooLongForShortPayload,
  TOO_LONG_FOR_SHORT_MESSAGE,
  validateShortDraft,
} from "@/lib/short-generation";
import type { VideoMode } from "@/lib/types";

function resolveVideoMode(raw: unknown): VideoMode {
  return raw === "long" ? "long" : "short";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ideaText,
      profileContext,
      direction,
      adjustment,
      currentDraft,
      videoMode: rawMode,
    } = body as {
      ideaText?: string;
      profileContext?: string;
      direction?: {
        name: string;
        promise: string;
        angle: string;
        hook: string;
        why: string;
      };
      adjustment?: string;
      currentDraft?: {
        hook: string;
        scriptBody?: string;
        closing: string;
        estimatedSeconds: number;
        blocks?: Array<{ title: string; body: string; id?: string }>;
      };
      videoMode?: VideoMode;
    };
    const videoMode = resolveVideoMode(rawMode);

    if (!ideaText?.trim() || !direction) {
      return NextResponse.json(
        { error: "Faltan datos del borrador." },
        { status: 400 }
      );
    }

    const currentDraftJson = currentDraft ? JSON.stringify(currentDraft) : null;
    const tooLong = rejectIfAnyTooLong([
      { value: ideaText, max: AI_INPUT_CAPS.ideaText, label: "La idea" },
      {
        value: profileContext,
        max: AI_INPUT_CAPS.profileContext,
        label: "El contexto del perfil",
      },
      { value: adjustment, max: AI_INPUT_CAPS.adjustment, label: "Los ajustes" },
      {
        value: currentDraftJson,
        max: AI_INPUT_CAPS.currentDraftJson,
        label: "El borrador actual",
      },
      {
        value: direction.name,
        max: AI_INPUT_CAPS.directionField,
        label: "El nombre del enfoque",
      },
      {
        value: direction.promise,
        max: AI_INPUT_CAPS.directionField,
        label: "La promesa del enfoque",
      },
      {
        value: direction.angle,
        max: AI_INPUT_CAPS.directionField,
        label: "El ángulo del enfoque",
      },
      {
        value: direction.hook,
        max: AI_INPUT_CAPS.directionField,
        label: "El hook del enfoque",
      },
      {
        value: direction.why,
        max: AI_INPUT_CAPS.directionField,
        label: "El porqué del enfoque",
      },
    ]);
    if (tooLong) return tooLong;

    const preflight = await gateAiGeneration({ consume: false });
    if (preflight.blocked) return preflight.blocked;

    const isRevision = Boolean(adjustment?.trim() && currentDraft);
    const prompt =
      videoMode === "long"
        ? buildLongDraftPrompt({
            ideaText,
            profileContext,
            direction,
            adjustment,
            currentDraft,
            isRevision,
          })
        : buildDraftPrompt({
            ideaText,
            profileContext,
            direction,
            adjustment,
            currentDraft: currentDraft
              ? {
                  hook: currentDraft.hook,
                  scriptBody: currentDraft.scriptBody || "",
                  closing: currentDraft.closing,
                  estimatedSeconds: currentDraft.estimatedSeconds,
                }
              : undefined,
            isRevision,
          });

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      hook?: string;
      scriptBody?: string;
      closing?: string;
      estimatedSeconds?: number;
      blocks?: Array<{ title?: string; body?: string; id?: string }>;
      tooLongForShort?: boolean;
      ideaTooThinForLong?: boolean;
      error?: string;
    }>(raw);

    if (videoMode === "short" && isTooLongForShortPayload(parsed)) {
      return NextResponse.json(
        { error: TOO_LONG_FOR_SHORT_MESSAGE, code: "too_long_for_short" },
        { status: 422 }
      );
    }

    if (videoMode === "long" && isIdeaTooThinForLongPayload(parsed)) {
      return NextResponse.json(
        {
          error: IDEA_TOO_THIN_FOR_LONG_MESSAGE,
          code: "idea_too_thin_for_long",
        },
        { status: 422 }
      );
    }

    if (videoMode === "long") {
      const validated = validateLongDraft(parsed);
      if (!validated.ok) {
        const status =
          validated.error === IDEA_TOO_THIN_FOR_LONG_MESSAGE ? 422 : 502;
        return NextResponse.json(
          {
            error: validated.error,
            ...(status === 422 ? { code: "idea_too_thin_for_long" } : {}),
          },
          { status }
        );
      }

      const gate = await gateAiGeneration();
      if (gate.blocked) return gate.blocked;

      return NextResponse.json({
        draft: {
          hook: validated.draft.hook,
          scriptBody: validated.draft.scriptBody,
          closing: validated.draft.closing,
          estimatedSeconds: validated.draft.estimatedSeconds,
          blocks: validated.draft.blocks,
          beats: [],
          format: "guide" as const,
        },
        billing: gate.billing,
      });
    }

    const validated = validateShortDraft(parsed);
    if (!validated.ok) {
      const status = validated.error === TOO_LONG_FOR_SHORT_MESSAGE ? 422 : 502;
      return NextResponse.json(
        {
          error: validated.error,
          ...(status === 422 ? { code: "too_long_for_short" } : {}),
        },
        { status }
      );
    }

    const gate = await gateAiGeneration();
    if (gate.blocked) return gate.blocked;

    return NextResponse.json({
      draft: {
        ...validated.draft,
        beats: [],
        format: "guide" as const,
      },
      billing: gate.billing,
    });
  } catch (err) {
    return aiRouteError(
      "generate-draft",
      err,
      "No pudimos generar la guía. Intenta de nuevo en un momento."
    );
  }
}
