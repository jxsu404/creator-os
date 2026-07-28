import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import {
  buildDraftPrompt,
  isTooLongForShortPayload,
  TOO_LONG_FOR_SHORT_MESSAGE,
  validateShortDraft,
} from "@/lib/short-generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ideaText,
      profileContext,
      direction,
      adjustment,
      currentDraft,
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
        scriptBody: string;
        closing: string;
        estimatedSeconds: number;
      };
    };

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
    const prompt = buildDraftPrompt({
      ideaText,
      profileContext,
      direction,
      adjustment,
      currentDraft,
      isRevision,
    });

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      hook?: string;
      scriptBody?: string;
      closing?: string;
      estimatedSeconds?: number;
      tooLongForShort?: boolean;
      error?: string;
    }>(raw);

    if (isTooLongForShortPayload(parsed)) {
      return NextResponse.json(
        { error: TOO_LONG_FOR_SHORT_MESSAGE, code: "too_long_for_short" },
        { status: 422 }
      );
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
