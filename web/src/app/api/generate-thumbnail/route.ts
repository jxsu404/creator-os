import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import {
  buildThumbnailPrompt,
  THUMBNAIL_STYLE_PROMPT_MAX,
} from "@/lib/thumbnail-prompt";

const MAX_REFS = 3;
const MAX_REF_CHARS = 900_000; // ~compact JPEG data URL

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
      stylePrompt,
      extraInstructions,
      referenceImages,
    } = body as {
      thumbnailIdea?: string;
      title?: string;
      ideaText?: string;
      profileContext?: string;
      stylePrompt?: string;
      extraInstructions?: string;
      referenceImages?: unknown;
    };

    const idea = thumbnailIdea?.trim();
    if (!idea) {
      return NextResponse.json(
        { error: "Falta la idea de miniatura." },
        { status: 400 }
      );
    }

    const refs = Array.isArray(referenceImages)
      ? referenceImages
          .filter((u): u is string => typeof u === "string")
          .map((u) => u.trim())
          .filter(
            (u) =>
              (u.startsWith("data:image/") || u.startsWith("http")) &&
              u.length <= MAX_REF_CHARS
          )
          .slice(0, MAX_REFS)
      : [];

    const tooLong = rejectIfAnyTooLong([
      {
        value: idea,
        max: AI_INPUT_CAPS.thumbnailIdea,
        label: "La idea de miniatura",
      },
      {
        value: title,
        max: AI_INPUT_CAPS.existingTitle,
        label: "El título",
      },
      {
        value: ideaText,
        max: AI_INPUT_CAPS.ideaText,
        label: "La idea",
      },
      {
        value: profileContext,
        max: AI_INPUT_CAPS.profileContext,
        label: "El contexto del perfil",
      },
      {
        value: stylePrompt,
        max: THUMBNAIL_STYLE_PROMPT_MAX,
        label: "el estilo de miniatura",
      },
      {
        value: extraInstructions,
        max: AI_INPUT_CAPS.thumbnailIdea,
        label: "las instrucciones extra",
      },
    ]);
    if (tooLong) return tooLong;

    const prompt = buildThumbnailPrompt({
      stylePrompt,
      thumbnailIdea: idea,
      title,
      ideaText,
      profileContext,
      extraInstructions,
    });

    const imageDataUrl = await generateImage(prompt, {
      referenceImages: refs,
    });

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
