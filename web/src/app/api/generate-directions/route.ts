import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/ai";

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

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Eres un compañero creativo para creadores de TikTok/Reels/Shorts.
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
Sin introducción, sin viralidad garantizada, sin clichés forzados del nicho.`,
        },
        {
          role: "user",
          content: `Contexto del creador:\n${profileContext || "No especificado"}\n\nIdea:\n${ideaText.trim()}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No pude armar buenos enfoques. Intenta de nuevo." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw) as {
      directions: Array<{
        name: string;
        promise: string;
        angle: string;
        hook: string;
        why: string;
      }>;
    };

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
