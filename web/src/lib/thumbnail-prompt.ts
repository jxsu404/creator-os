/** Estilo base por defecto para miniaturas (YouTube 16:9). */
export const DEFAULT_THUMBNAIL_STYLE_PROMPT = [
  "Create a YouTube thumbnail image (16:9).",
  "Bold contrast, readable face-or-subject energy, 2-4 short overlay words max if any text.",
  "No watermarks, no logos of real brands, no tiny unreadable text.",
  "Gaming / Roblox creator style is OK when the context says so.",
].join("\n");

export const THUMBNAIL_STYLE_PROMPT_MAX = 1200;

export type ThumbnailPromptInput = {
  /** Estilo / instrucciones del creador (vacío = default). */
  stylePrompt?: string | null;
  /** Concepto visual de esta pieza (obligatorio). */
  thumbnailIdea: string;
  title?: string | null;
  ideaText?: string | null;
  profileContext?: string | null;
  /** Extra one-shot para esta generación (opcional). */
  extraInstructions?: string | null;
};

/**
 * Arma el prompt final enviado al generador de imagen.
 * El estilo personalizado reemplaza el default si viene con texto.
 */
export function buildThumbnailPrompt(input: ThumbnailPromptInput): string {
  const style =
    input.stylePrompt?.trim() || DEFAULT_THUMBNAIL_STYLE_PROMPT;
  const idea = input.thumbnailIdea.trim();
  const parts = [
    style,
    "",
    `Thumbnail concept: ${idea}`,
    input.title?.trim() ? `Video title: ${input.title.trim()}` : "",
    input.ideaText?.trim()
      ? `Video idea: ${input.ideaText.trim().slice(0, 400)}`
      : "",
    input.profileContext?.trim()
      ? `Creator context: ${input.profileContext.trim().slice(0, 400)}`
      : "",
    input.extraInstructions?.trim()
      ? `Extra instructions from creator: ${input.extraInstructions.trim()}`
      : "",
  ];
  return parts.filter(Boolean).join("\n");
}
