import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import { unauthorizedApiResponse } from "@/lib/supabase/require-api-user";

export async function POST(request: Request) {
  try {
    const denied = await unauthorizedApiResponse();
    if (denied) return denied;

    const body = await request.json();
    const { ideaText } = body as { ideaText?: string };

    if (!ideaText?.trim()) {
      return NextResponse.json({ error: "Falta la idea." }, { status: 400 });
    }

    const prompt = `Eres un compañero creativo para creadores de TikTok/Reels/Shorts/YouTube.
A partir de una idea de video escrita de forma rápida y desordenada, generas:
1) Un título corto para identificarla en una lista.
2) Una posible miniatura: concepto visual concreto (como si fuera el thumbnail del video).

Reglas del título:
- Máximo 7 palabras.
- Español neutro.
- Capta la esencia de la idea, no un título clickbait para el video final.
- Sin comillas, sin emojis, sin punto final, sin hashtags.

Reglas de thumbnailIdea:
- UNA sola línea, máx ~120 caracteres.
- Describe la miniatura: sujeto + texto en pantalla + emoción/ángulo.
- Debe verse como una miniatura de YouTube/Shorts posible, no un mood abstracto.
- Sin emojis.

Responde SOLO JSON válido con esta forma:
{ "title": "...", "thumbnailIdea": "..." }

Idea:
${ideaText.trim()}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{ title?: string; thumbnailIdea?: string }>(
      raw
    );
    const title = parsed.title?.trim().replace(/^["'«]|["'»]$/g, "").trim();
    let thumbnailIdea =
      typeof parsed.thumbnailIdea === "string"
        ? parsed.thumbnailIdea.trim().replace(/\s+/g, " ")
        : "";

    if (!title) {
      return NextResponse.json(
        { error: "No pude generar un título." },
        { status: 502 }
      );
    }

    if (thumbnailIdea.length > 160) {
      thumbnailIdea = thumbnailIdea.slice(0, 160).trim();
    }

    return NextResponse.json({
      title,
      thumbnailIdea: thumbnailIdea || undefined,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar el título.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
