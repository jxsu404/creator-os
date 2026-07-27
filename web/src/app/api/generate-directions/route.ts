import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
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
    const { ideaText, profileContext } = body as {
      ideaText?: string;
      profileContext?: string;
    };

    if (!ideaText?.trim()) {
      return NextResponse.json({ error: "Falta la idea." }, { status: 400 });
    }

    const tooLong = rejectIfAnyTooLong([
      { value: ideaText, max: AI_INPUT_CAPS.ideaText, label: "La idea" },
      { value: profileContext, max: AI_INPUT_CAPS.profileContext, label: "El contexto del perfil" },
    ]);
    if (tooLong) return tooLong;

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
Si hay contexto de juego y estilo de grabación, úsalo: vocabulario correcto, no inventes datos del update, y que los 3 enfoques encajen con cómo graba este creador (tipos de video, ritmo). Si la idea no es de ese juego, ignora el bloque de juego y no lo fuerzas.

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

    const directions = (parsed.directions || [])
      .map((d) => ({
        name: String(d?.name || "").trim(),
        promise: String(d?.promise || "").trim(),
        angle: String(d?.angle || "").trim(),
        hook: String(d?.hook || "").trim(),
        why: String(d?.why || "").trim(),
      }))
      .filter(
        (d) => d.name && d.promise && d.angle && d.hook && d.why
      );

    if (directions.length < 3) {
      return NextResponse.json(
        { error: "No pude armar buenos enfoques. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      directions: directions.slice(0, 3),
      billing: gate.billing,
    });
  } catch (err) {
    return aiRouteError("generate-directions", err, "No pudimos generar los enfoques. Intenta de nuevo en un momento.");
  }
}
