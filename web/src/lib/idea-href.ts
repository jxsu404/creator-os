import type { Idea } from "./types";

/** Ruta correcta según estado y datos reales (no asume draft). */
export function ideaHref(idea: Idea): string {
  if (
    (idea.status === "ready" || idea.status === "recorded") &&
    idea.draft
  ) {
    return `/ideas/${idea.id}/script`;
  }
  if (idea.status === "in_progress" && idea.draft) {
    return `/ideas/${idea.id}/draft`;
  }
  return `/ideas/${idea.id}`;
}
