import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import {
  buildDirectionsPrompt,
  isTooLongForShortPayload,
  TOO_LONG_FOR_SHORT_MESSAGE,
  validateShortDirections,
  type RawDirection,
} from "@/lib/short-generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ideaText, profileContext } = body as {
      ideaText?: string;
      profileContext?: string;
    };

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

    const prompt = buildDirectionsPrompt(ideaText, profileContext);
    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      directions?: RawDirection[];
      tooLongForShort?: boolean;
      error?: string;
    }>(raw);

    if (isTooLongForShortPayload(parsed)) {
      return NextResponse.json(
        { error: TOO_LONG_FOR_SHORT_MESSAGE, code: "too_long_for_short" },
        { status: 422 }
      );
    }

    const validated = validateShortDirections(parsed.directions);

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
