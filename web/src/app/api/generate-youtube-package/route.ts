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

    const prompt = `Eres un editor de YouTube para un creador de contenido (gaming / Roblox / short + long).
Generas el PAQUETE DE SUBIDA listo para pegar en YouTube Studio.
Idioma: español. Sin promesas de viralidad. Sin inventar stats, códigos ni actualizaciones que no estén en el contexto.

Límites reales de YouTube:
- title: máx 100 caracteres (ideal ~60–70, keyword al inicio)
- description: útil, 800–1800 caracteres aprox (máx 5000). Primeras 2 líneas = gancho + qué verá el viewer. Incluye saltos de línea. Al final: 3–5 hashtags relevantes y CTAs del brand si vienen en el contexto (Discord, Kick, suscripción).
- tags: 8–12 etiquetas relevantes (frases cortas). Total de caracteres de todas las tags < 450. Sin tags irrelevantes famosas.
- thumbnailIdea: UNA sola línea (máx ~120 caracteres). Concepto visual concreto para la miniatura (texto en pantalla + sujeto + emoción). NO generes la imagen; solo la idea.

Responde SOLO JSON:
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2"],
  "thumbnailIdea": "una línea"
}

Contexto del creador:
${profileContext || "No especificado"}

Idea original:
${(ideaText || "").trim() || "(ver guion)"}

${
  existingTitle?.trim()
    ? `Título interno actual (puedes mejorarlo para YouTube): ${existingTitle.trim()}`
    : ""
}

${
  direction
    ? `Enfoque:
- Nombre: ${direction.name}
- Promesa: ${direction.promise}
- Ángulo: ${direction.angle}
- Hook: ${direction.hook}`
    : ""
}

Guion / guía de grabación:
${(script || "").trim().slice(0, 6000)}`;

    const raw = await generateJson(prompt);
    const parsed = parseJsonLoose<{
      title?: string;
      description?: string;
      tags?: string[];
      thumbnailIdea?: string;
    }>(raw);

    let title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    let description =
      typeof parsed.description === "string" ? parsed.description.trim() : "";
    let thumbnailIdea =
      typeof parsed.thumbnailIdea === "string"
        ? parsed.thumbnailIdea.trim().replace(/\s+/g, " ")
        : "";
    let tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    if (title.length > 100) title = title.slice(0, 100).trim();
    if (description.length > 5000) description = description.slice(0, 5000).trim();
    if (thumbnailIdea.length > 160) {
      thumbnailIdea = thumbnailIdea.slice(0, 160).trim();
    }

    // Recorta tags al límite combinado ~500
    const capped: string[] = [];
    let used = 0;
    for (const tag of tags) {
      const piece = tag.slice(0, 30);
      const cost = piece.length + (capped.length > 0 ? 1 : 0);
      if (used + cost > 480) break;
      capped.push(piece);
      used += cost;
      if (capped.length >= 15) break;
    }
    tags = capped;

    if (!title || !description || tags.length === 0 || !thumbnailIdea) {
      return NextResponse.json(
        { error: "El paquete llegó incompleto. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      package: {
        title,
        description,
        tags,
        thumbnailIdea,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar paquete YouTube.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
