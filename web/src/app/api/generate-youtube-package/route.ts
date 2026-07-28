import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import {
  AI_INPUT_CAPS,
  aiRouteError,
  rejectIfAnyTooLong,
} from "@/lib/ai-input";
import { gateAiGeneration } from "@/lib/billing/gate";
import { normalizeYoutubePackages } from "@/lib/youtube-package";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ideaText,
      profileContext,
      direction,
      script,
      existingTitle,
    } = body as {
      ideaText?: string;
      profileContext?: string;
      direction?: {
        name: string;
        promise: string;
        angle: string;
        hook: string;
      };
      script?: string;
      existingTitle?: string;
    };

    if (!ideaText?.trim() && !script?.trim()) {
      return NextResponse.json(
        { error: "Falta el guion o la idea." },
        { status: 400 }
      );
    }

    const tooLong = rejectIfAnyTooLong([
      { value: ideaText, max: AI_INPUT_CAPS.ideaText, label: "La idea" },
      { value: profileContext, max: AI_INPUT_CAPS.profileContext, label: "El contexto del perfil" },
      { value: script, max: AI_INPUT_CAPS.script, label: "El guion" },
      { value: existingTitle, max: AI_INPUT_CAPS.existingTitle, label: "El título existente" },
      { value: direction?.name, max: AI_INPUT_CAPS.directionField, label: "El nombre del enfoque" },
      { value: direction?.promise, max: AI_INPUT_CAPS.directionField, label: "La promesa del enfoque" },
      { value: direction?.angle, max: AI_INPUT_CAPS.directionField, label: "El ángulo del enfoque" },
      { value: direction?.hook, max: AI_INPUT_CAPS.directionField, label: "El hook del enfoque" },
    ]);
    if (tooLong) return tooLong;

    const preflight = await gateAiGeneration({ consume: false });
    if (preflight.blocked) return preflight.blocked;

    const prompt = `Eres un editor de YouTube / TikTok / Shorts para un creador (gaming / Roblox / short + long).
Generas exactamente 3 OPCIONES DISTINTAS de paquete de subida (título, descripción, etiquetas, idea de miniatura).
El creador elegirá UNA. No son 3 copias del mismo título con palabras cambiadas.

Cada opción debe diferir en estrategia, por ejemplo:
- una con keyword/juego al inicio (descubrimiento)
- una más emocional / curiosidad (retención del scroll)
- una más clara / beneficio directo (qué aprende el viewer)

Idioma: español. Sin promesas de viralidad. Sin inventar stats, códigos ni actualizaciones que no estén en el contexto.
Si hay bloque "Descripciones de YouTube" en el contexto del creador: las 3 descripciones deben seguir ese formato (estructura, tono, CTAs, hashtags). Priorízalo sobre plantillas genéricas.
El título debe servir también como caption corta de TikTok/Shorts si el video es vertical.

Límites reales:
- title: máx 100 caracteres (ideal ~60–70)
- description: útil, 800–1800 caracteres aprox (máx 5000). Primeras 2 líneas = gancho + qué verá el viewer. Saltos de línea. Al final: 3–5 hashtags y CTAs del brand si vienen en el contexto.
- tags: 8–12 etiquetas (frases cortas). Total de caracteres de todas las tags < 450.
- thumbnailIdea: UNA línea (máx ~120). Concepto visual concreto. NO generes la imagen.
- label: 2–5 palabras que nombren la estrategia (ej. "Keyword primero", "Curiosidad", "Beneficio claro")

Responde SOLO JSON:
{
  "packages": [
    {
      "label": "...",
      "title": "...",
      "description": "...",
      "tags": ["tag1", "tag2"],
      "thumbnailIdea": "una línea"
    }
  ]
}

Contexto del creador:
${profileContext || "No especificado"}

Idea original:
${(ideaText || "").trim() || "(ver guion)"}

${
  existingTitle?.trim()
    ? `Título interno actual (puedes mejorarlo): ${existingTitle.trim()}`
    : ""
}

${
  direction
    ? `Enfoque elegido:
- Nombre: ${direction.name}
- Promesa: ${direction.promise}
- Ángulo: ${direction.angle}
- Hook: ${direction.hook}`
    : ""
}

Guion / guía de grabación:
${(script || "").trim()}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{ packages?: unknown }>(raw);
    const packages = normalizeYoutubePackages(parsed.packages).slice(0, 3);

    if (packages.length < 3) {
      return NextResponse.json(
        { error: "No pude armar 3 opciones buenas. Intenta de nuevo." },
        { status: 502 }
      );
    }

    const gate = await gateAiGeneration();
    if (gate.blocked) return gate.blocked;

    const generatedAt = new Date().toISOString();
    return NextResponse.json({
      packages: packages.map((p) => ({ ...p, generatedAt })),
      billing: gate.billing,
    });
  } catch (err) {
    return aiRouteError("generate-youtube-package", err, "No pudimos generar el paquete de YouTube. Intenta de nuevo en un momento.");
  }
}
