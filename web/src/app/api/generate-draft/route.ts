import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import { gateAiGeneration } from "@/lib/billing/gate";

export async function POST(request: Request) {
  try {
    const denied = await gateAiGeneration();
    if (denied) return denied;

    const body = await request.json();
    const {
      ideaText,
      profileContext,
      direction,
      adjustment,
      currentDraft,
    } = body as {
      ideaText?: string;
      profileContext?: string;
      direction?: {
        name: string;
        promise: string;
        angle: string;
        hook: string;
        why: string;
      };
      adjustment?: string;
      currentDraft?: {
        hook: string;
        scriptBody: string;
        closing: string;
        estimatedSeconds: number;
      };
    };

    if (!ideaText?.trim() || !direction) {
      return NextResponse.json({ error: "Faltan datos del borrador." }, { status: 400 });
    }

    const isRevision = Boolean(adjustment?.trim() && currentDraft);

    const prompt = `Eres un compañero creativo. Armas una GUÍA PARA GRABAR de video short-form (TikTok/Reels/Shorts).
Idioma: español. Sin relleno. Sin promesas de viralidad.

Incluye solo el guion hablado (hook + cuerpo + cierre). No inventes plan de cámara ni tomas.

Responde SOLO JSON:
{
  "hook": "gancho hablado primeros segundos",
  "scriptBody": "cuerpo del guion palabra por palabra",
  "closing": "cierre/CTA verbal una línea",
  "estimatedSeconds": 45
}
Si hay contexto de juego: usa términos correctos; no inventes stats, códigos ni patch notes que no estén en el update pegado.
Si hay estilo de grabación: el guion debe encajar (gameplay + voiceover, ritmo short, sin intros largas ni asumir facecam).
Si la idea no es de ese juego, no fuerces el contexto del juego.

Contexto del creador:
${profileContext || "No especificado"}

Idea:
${ideaText.trim()}

Enfoque elegido:
- Nombre: ${direction.name}
- Promesa: ${direction.promise}
- Ángulo: ${direction.angle}
- Hook base: ${direction.hook}
- Por qué: ${direction.why}

${
  isRevision
    ? `El creador ya tiene este borrador y pide AJUSTES. Reescribe la guía completa aplicando los ajustes, sin perder lo que funciona:

Borrador actual:
${JSON.stringify(currentDraft, null, 2)}

Ajustes pedidos:
${adjustment!.trim()}`
    : `Ajuste inicial del creador: ${adjustment?.trim() || "Ninguno"}`
}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      hook?: string;
      scriptBody?: string;
      closing?: string;
      estimatedSeconds?: number;
    }>(raw);

    const hook = typeof parsed.hook === "string" ? parsed.hook.trim() : "";
    const scriptBody =
      typeof parsed.scriptBody === "string" ? parsed.scriptBody.trim() : "";
    const closing =
      typeof parsed.closing === "string" ? parsed.closing.trim() : "";

    if (!hook || !scriptBody) {
      return NextResponse.json(
        { error: "La guía llegó incompleta. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      draft: {
        hook,
        scriptBody,
        closing,
        beats: [],
        estimatedSeconds:
          typeof parsed.estimatedSeconds === "number" &&
          parsed.estimatedSeconds > 0
            ? parsed.estimatedSeconds
            : 45,
        format: "guide" as const,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar borrador.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
