/** Normaliza un paquete crudo de IA (título / desc / tags / miniatura). */

export type RawYoutubePackage = {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  thumbnailIdea?: unknown;
  label?: unknown;
};

export type NormalizedYoutubePackage = {
  title: string;
  description: string;
  tags: string[];
  thumbnailIdea: string;
  /** Nombre corto de la opción (ej. "Keyword primero"). */
  label?: string;
};

function capTags(tags: string[]): string[] {
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
  return capped;
}

export function normalizeYoutubePackage(
  raw: RawYoutubePackage | null | undefined
): NormalizedYoutubePackage | null {
  if (!raw || typeof raw !== "object") return null;

  let title = typeof raw.title === "string" ? raw.title.trim() : "";
  let description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  let thumbnailIdea =
    typeof raw.thumbnailIdea === "string"
      ? raw.thumbnailIdea.trim().replace(/\s+/g, " ")
      : "";
  const label =
    typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : undefined;

  let tags = Array.isArray(raw.tags)
    ? raw.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  if (title.length > 100) title = title.slice(0, 100).trim();
  if (description.length > 5000) description = description.slice(0, 5000).trim();
  if (thumbnailIdea.length > 160) {
    thumbnailIdea = thumbnailIdea.slice(0, 160).trim();
  }
  tags = capTags(tags);

  if (!title || !description || tags.length === 0 || !thumbnailIdea) {
    return null;
  }

  return {
    title,
    description,
    tags,
    thumbnailIdea,
    ...(label ? { label } : {}),
  };
}

export function normalizeYoutubePackages(
  rawList: unknown
): NormalizedYoutubePackage[] {
  if (!Array.isArray(rawList)) return [];
  const out: NormalizedYoutubePackage[] = [];
  for (const item of rawList) {
    const n = normalizeYoutubePackage(item as RawYoutubePackage);
    if (n) out.push(n);
  }
  return out;
}
