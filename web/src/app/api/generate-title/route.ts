import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";

export async function POST(request: Request) {
  try {
    const gate = await gateAiGeneration();
    if (gate.blocked) return gate.blocked;

    const body = await request.json();
    const { ideaText } = body as { ideaText?: string };

    if (!ideaText?.trim()) {
      return NextResponse.json({ error: "Falta la idea." }, { status: 400 });
    }

    const tooLong = rejectIfTooLong(ideaText, AI_INPUT_CAPS.ideaText, "la idea");
    if (tooLong) return tooLong;

    const prompt = `Eres un compañero creativo para creadores de TikTok/Reels/Shorts.
A partir de una idea de video escrita de forma rápida y desordenada, eliges UN título corto y claro para identificarla en una lista.
Reglas:
- Máximo 7 palabras.
- Español neutro.
- Capta la esencia de la idea, no un título clickbait para el video final.
- Sin comillas, sin emojis, sin punto final, sin hashtags.
Responde SOLO JSON válido con esta forma:
{ "title": "..." }

Idea:
${ideaText.trim()}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{ title?: string }>(raw);
    const title = parsed.title?.trim().replace(/^["'«]|["'»]$/g, "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "No pude generar un título." },
        { status: 502 }
      );
    }

    return NextResponse.json({ title, billing: gate.billing });
  } catch (err) {
    return aiRouteError("generate-title", err, "No pudimos generar el título. Intenta de nuevo en un momento.");
  }
}
