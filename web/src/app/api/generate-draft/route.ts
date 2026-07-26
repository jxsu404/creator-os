import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ideaText,
      profileContext,
      direction,
      adjustment,
      format,
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
      format?: "script" | "beats" | "both";
    };

    if (!ideaText?.trim() || !direction || !format) {
      return NextResponse.json({ error: "Faltan datos del borrador." }, { status: 400 });
    }

    const prompt = `Eres un compañero creativo. Armas un borrador listo para grabar (short-form).
Idioma: español. Sin relleno tipo "¡claro!". Sin promesas de viralidad.
Responde SOLO JSON:
{
  "hook": "gancho hablado primeros segundos",
  "scriptBody": "cuerpo del guion palabra por palabra (puede ir vacío si format es beats)",
  "closing": "cierre/CTA verbal opcional una línea",
  "beats": [
    { "say": "qué decir", "show": "qué mostrar", "notes": "opcional" }
  ],
  "estimatedSeconds": 45
}
Si format es "script": beats puede ser [].
Si format es "beats": scriptBody puede ser "".
Si format es "both": llena script y beats alineados.
4–7 beats típicos para un short.

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

Ajuste del creador: ${adjustment?.trim() || "Ninguno"}
Formato pedido: ${format}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      hook: string;
      scriptBody: string;
      closing: string;
      beats: Array<{ say: string; show: string; notes?: string }>;
      estimatedSeconds: number;
    }>(raw);

    return NextResponse.json({ draft: parsed });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar borrador.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
