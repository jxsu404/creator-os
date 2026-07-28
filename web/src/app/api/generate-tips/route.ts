import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import { normalizeTips } from "@/lib/tips-context";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileContext, recentContent } = body as {
      profileContext?: string;
      recentContent?: string;
    };

    const tooLong = rejectIfAnyTooLong([
      { value: profileContext, max: AI_INPUT_CAPS.profileContext, label: "El contexto del perfil" },
      { value: recentContent, max: AI_INPUT_CAPS.recentContent, label: "El contenido reciente" },
    ]);
    if (tooLong) return tooLong;

    const preflight = await gateAiGeneration({ consume: false });
    if (preflight.blocked) return preflight.blocked;

    const prompt = `Eres un compañero creativo para creadores de TikTok/Reels/Shorts (Ideazo).
Generas exactamente 3 consejos de OFICIO CREATIVO, accionables y DISTINTOS, personalizados al nicho y al contenido reciente del creador.

Enfoque de los consejos (elige ángulos distintos entre los 3):
- variedad de enfoques / ángulos que aún no ha cubierto
- ganchos y primera frase más claras
- claridad de la idea (una promesa por video)
- ritmo y estructura short-form
- cómo aprovechar patrones de lo que ya grabó sin repetirse

Prohibido:
- tips de "crecimiento" genéricos (horario de publicación, hashtags, algoritmos)
- promesas de viralidad o rankings
- analytics, métricas de vanity o comparaciones con otros creadores
- tomas de cámara / planes de rodaje
- clichés forzados del nicho

Idioma: español natural, directo, como a un colega.
Cada tip: título corto (3–6 palabras) + cuerpo de 1–2 frases concretas.
Si hay contenido reciente, refiérete a patrones (temas, tipo de pieza), NO copies títulos literales largos.
Si no hay contenido reciente, basate solo en el nicho/descripción del canal.

Responde SOLO JSON válido con esta forma:
{
  "tips": [
    { "title": "...", "body": "..." },
    { "title": "...", "body": "..." },
    { "title": "...", "body": "..." }
  ]
}

Contexto del creador:
${profileContext?.trim() || "No especificado"}

Contenido reciente:
${recentContent?.trim() || "Ninguno aún — personaliza solo con el nicho."}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{ tips: unknown }>(raw);
    const tips = normalizeTips(parsed.tips);

    if (tips.length < 3) {
      return NextResponse.json(
        { error: "No pude armar buenos consejos. Intenta de nuevo." },
        { status: 502 }
      );
    }

    const gate = await gateAiGeneration();
    if (gate.blocked) return gate.blocked;

    return NextResponse.json({ tips, billing: gate.billing });
  } catch (err) {
    return aiRouteError("generate-tips", err, "No pudimos generar los consejos. Intenta de nuevo en un momento.");
  }
}
