import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";

export async function POST(request: Request) {
  try {
    const gate = await gateAiGeneration();
    if (gate.blocked) return gate.blocked;

    const body = await request.json();
    const {
      thumbnailIdea,
      title,
      ideaText,
      profileContext,
    } = body as {
      thumbnailIdea?: string;
      title?: string;
      ideaText?: string;
      profileContext?: string;
    };

    const idea = thumbnailIdea?.trim();
    if (!idea) {
      return NextResponse.json(
        { error: "Falta la idea de miniatura." },
        { status: 400 }
      );
    }

    const tooLong = rejectIfAnyTooLong([
      {
        value: idea,
        max: AI_INPUT_CAPS.thumbnailIdea,
        label: "la idea de miniatura",
      },
      {
        value: title,
        max: AI_INPUT_CAPS.existingTitle,
        label: "el título",
      },
      {
        value: ideaText,
        max: AI_INPUT_CAPS.ideaText,
        label: "la idea",
      },
      {
        value: profileContext,
        max: AI_INPUT_CAPS.profileContext,
        label: "el contexto del perfil",
      },
    ]);
    if (tooLong) return tooLong;

    const prompt = [
      "Create a YouTube thumbnail image (16:9).",
      "Bold contrast, readable face-or-subject energy, 2-4 short overlay words max if any text.",
      "No watermarks, no logos of real brands, no tiny unreadable text.",
      "Gaming / Roblox creator style is OK when the context says so.",
      "",
      `Thumbnail concept: ${idea}`,
      title?.trim() ? `Video title: ${title.trim()}` : "",
      ideaText?.trim() ? `Video idea: ${ideaText.trim().slice(0, 400)}` : "",
      profileContext?.trim()
        ? `Creator context: ${profileContext.trim().slice(0, 400)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const imageDataUrl = await generateImage(prompt);

    return NextResponse.json({
      imageDataUrl,
      billing: gate.billing,
    });
  } catch (err) {
    return aiRouteError(
      "generate-thumbnail",
      err,
      "No pudimos generar la miniatura. Intenta de nuevo en un momento."
    );
  }
}
