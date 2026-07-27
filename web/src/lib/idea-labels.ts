import type { Idea, IdeaStatus } from "./types";
import { categorySlug, resolveIdeaCategory } from "./idea-thumbs";

/** Buckets de la home / lista: pendientes → listas → grabadas. */
export type IdeaStatusGroup = "pending" | "ready" | "recorded";

export const STATUS_GROUP: Record<
  Exclude<IdeaStatus, "archived">,
  IdeaStatusGroup
> = {
  captured: "pending",
  in_progress: "pending",
  ready: "ready",
  recorded: "recorded",
};

export const STATUS_GROUP_LABEL: Record<IdeaStatusGroup, string> = {
  pending: "Pendientes",
  ready: "Listas para grabar",
  recorded: "Grabadas",
};

/** Tone CSS modifier for section headers and status chips. */
export const STATUS_GROUP_TONE: Record<IdeaStatusGroup, string> = {
  pending: "gray",
  ready: "orange",
  recorded: "green",
};

export function ideaStatusGroup(status: IdeaStatus): IdeaStatusGroup | null {
  if (status === "archived") return null;
  return STATUS_GROUP[status];
}

export function groupIdeasByStatus(
  ideas: Idea[]
): Record<IdeaStatusGroup, Idea[]> {
  const groups: Record<IdeaStatusGroup, Idea[]> = {
    pending: [],
    ready: [],
    recorded: [],
  };
  for (const idea of ideas) {
    const g = ideaStatusGroup(idea.status);
    if (g) groups[g].push(idea);
  }
  return groups;
}

/** Clave CSS para el color del chip de categoría. */
export function categoryColorKey(
  idea: { category?: string },
  niches: string[] = []
): string {
  return categorySlug(resolveIdeaCategory(idea, niches));
}

/** Texto del chip de categoría; null si no hay nada útil que mostrar. */
export function categoryDisplayLabel(
  idea: { category?: string },
  niches: string[] = []
): string | null {
  if (idea.category?.trim()) return idea.category.trim();
  const fromProfile = niches.find((n) => n.trim())?.trim();
  return fromProfile || null;
}
