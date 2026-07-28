import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import {
  buildLongDirectionsPrompt,
  IDEA_TOO_THIN_FOR_LONG_MESSAGE,
  isIdeaTooThinForLongPayload,
  validateLongDirections,
} from "@/lib/long-generation";
import {
  buildDirectionsPrompt,
  isTooLongForShortPayload,
  TOO_LONG_FOR_SHORT_MESSAGE,
  validateShortDirections,
  type RawDirection,
} from "@/lib/short-generation";
import type { VideoMode } from "@/lib/types";

function resolveVideoMode(raw: unknown): VideoMode {
  return raw === "long" ? "long" : "short";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ideaText, profileContext, videoMode: rawMode } = body as {
      ideaText?: string;
      profileContext?: string;
      videoMode?: VideoMode;
    };
    const videoMode = resolveVideoMode(rawMode);

    if (!ideaText?.trim()) {
      return NextResponse.json({ error: "Falta la idea." }, { status: 400 });
    }

    const tooLong = rejectIfAnyTooLong([
      { value: ideaText, max: AI_INPUT_CAPS.ideaText, label: "La idea" },
      {
        value: profileContext,
        max: AI_INPUT_CAPS.profileContext,
        label: "El contexto del perfil",
      },
    ]);
    if (tooLong) return tooLong;

    const preflight = await gateAiGeneration({ consume: false });
    if (preflight.blocked) return preflight.blocked;

    const prompt =
      videoMode === "long"
        ? buildLongDirectionsPrompt(ideaText, profileContext)
        : buildDirectionsPrompt(ideaText, profileContext);
    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      directions?: RawDirection[];
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

    const validated =
      videoMode === "long"
        ? validateLongDirections(parsed.directions)
        : validateShortDirections(parsed.directions);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 502 });
    }

    const gate = await gateAiGeneration();
    if (gate.blocked) return gate.blocked;

    return NextResponse.json({
      directions: validated.directions,
      billing: gate.billing,
    });
  } catch (err) {
    return aiRouteError(
      "generate-directions",
      err,
      "No pudimos generar los enfoques. Intenta de nuevo en un momento."
    );
  }
}
