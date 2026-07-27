import { NextResponse } from "next/server";
import { generateJson, parseJsonLoose } from "@/lib/ai";
import { gateAiGeneration } from "@/lib/billing/gate";
import { normalizeYoutubePackages } from "@/lib/youtube-package";

export async function POST(request: Request) {
  try {
    const denied = await gateAiGeneration();
    if (denied) return denied;

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

    const prompt = `Eres un editor de YouTube / TikTok / Shorts para un creador (gaming / Roblox / short + long).
Generas exactamente 3 OPCIONES DISTINTAS de paquete de subida (título, descripción, etiquetas, idea de miniatura).
El creador elegirá UNA. No son 3 copias del mismo título con palabras cambiadas.

Cada opción debe diferir en estrategia, por ejemplo:
- una con keyword/juego al inicio (descubrimiento)
- una más emocional / curiosidad (retención del scroll)
- una más clara / beneficio directo (qué aprende el viewer)

Idioma: español. Sin promesas de viralidad. Sin inventar stats, códigos ni actualizaciones que no estén en el contexto.
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
${(script || "").trim().slice(0, 6000)}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{ packages?: unknown }>(raw);
    const packages = normalizeYoutubePackages(parsed.packages).slice(0, 3);

    if (packages.length < 3) {
      return NextResponse.json(
        { error: "No pude armar 3 opciones buenas. Intenta de nuevo." },
        { status: 502 }
      );
    }

    const generatedAt = new Date().toISOString();
    return NextResponse.json({
      packages: packages.map((p) => ({ ...p, generatedAt })),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar paquete YouTube.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
