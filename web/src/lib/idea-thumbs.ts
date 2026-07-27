/** Miniaturas fijas por categoría (sin IA / sin gastar API keys). */

import { NICHE_CHIPS } from "./types";

export type ThumbCategory = (typeof NICHE_CHIPS)[number] | "default";

const SLUG_BY_LABEL: Record<string, string> = {
  Gaming: "gaming",
  Roblox: "roblox",
  Guías: "guias",
  Showcases: "showcases",
  Opiniones: "opiniones",
  Vlogs: "vlogs",
  Fitness: "fitness",
  Cocina: "cocina",
  Finanzas: "finanzas",
  Educación: "educacion",
  Tech: "tech",
  Comedia: "comedia",
  Lifestyle: "lifestyle",
  Belleza: "belleza",
  Negocios: "negocios",
};

/** Normaliza un chip/categoría libre a slug de asset. */
export function categorySlug(category?: string | null): string {
  const raw = (category || "").trim();
  if (!raw) return "default";
  if (SLUG_BY_LABEL[raw]) return SLUG_BY_LABEL[raw];
  const lower = raw.toLowerCase();
  for (const [label, slug] of Object.entries(SLUG_BY_LABEL)) {
    if (label.toLowerCase() === lower) return slug;
  }
  // Acentos / variantes comunes
  if (lower.includes("gaming") || lower.includes("juego")) return "gaming";
  if (lower.includes("roblox")) return "roblox";
  if (lower.startsWith("gu") || lower.includes("guía") || lower.includes("guia"))
    return "guias";
  return "default";
}

/** Ruta pública de la miniatura predeterminada de una categoría. */
export function categoryThumbSrc(category?: string | null): string {
  const slug = categorySlug(category);
  return `/thumbs/${slug}.png`;
}

/**
 * Categoría efectiva de una idea:
 * 1) `idea.category` si es un chip conocido
 * 2) primer nicho del perfil
 * 3) default
 */
export function resolveIdeaCategory(
  idea: { category?: string },
  niches: string[] = []
): string {
  if (idea.category?.trim()) return idea.category.trim();
  const first = niches.find((n) => n.trim());
  return first?.trim() || "default";
}

/** Miniatura a mostrar: override del usuario (IA) o stock de categoría. */
export function resolveIdeaThumbSrc(
  idea: { category?: string; thumbnailUrl?: string },
  niches: string[] = []
): { src: string; custom: boolean } {
  const custom = idea.thumbnailUrl?.trim();
  if (custom) return { src: custom, custom: true };
  return {
    src: categoryThumbSrc(resolveIdeaCategory(idea, niches)),
    custom: false,
  };
}
