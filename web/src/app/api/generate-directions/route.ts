import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";

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

    const prompt = `Eres un compañero creativo para creadores de TikTok/Reels/Shorts.
Generas exactamente 3 enfoques DISTINTOS para convertir una idea vaga en un video short-form.
Cada enfoque debe diferir en ángulo, promesa y/o tono (no tres títulos del mismo video).
Formato vertical corto (30–60s aprox). Idioma: español.
Responde SOLO JSON válido con esta forma:
{
  "directions": [
    {
      "name": "3-6 palabras",
      "promise": "qué se lleva el viewer",
      "angle": "ángulo narrativo",
      "hook": "una línea de gancho",
      "why": "cuándo encaja este enfoque"
    }
  ]
}
Sin introducción, sin viralidad garantizada, sin clichés forzados del nicho.

Contexto del creador:
${profileContext || "No especificado"}

Idea:
${ideaText.trim()}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      directions: Array<{
        name: string;
        promise: string;
        angle: string;
        hook: string;
        why: string;
      }>;
    }>(raw);

    if (!parsed.directions || parsed.directions.length < 3) {
      return NextResponse.json(
        { error: "No pude armar buenos enfoques. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      directions: parsed.directions.slice(0, 3),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar enfoques.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
