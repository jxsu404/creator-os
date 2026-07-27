import { ideaPreview } from "./idea-preview";
import { patchIdea } from "./storage";
import type { Idea } from "./types";

/** Título a mostrar en listas: el generado por IA o, mientras llega, el preview del texto */
export function ideaTitle(idea: Idea, max = 110): string {
  const t = idea.title?.trim();
  return t || ideaPreview(idea.rawText, max);
}

/** Concepto visual de posible miniatura (idea top-level o del paquete YT). */
export function ideaThumbnailConcept(idea: Idea): string {
  return (
    idea.thumbnailIdea?.trim() ||
    idea.youtubePackage?.thumbnailIdea?.trim() ||
    ""
  );
}

const inFlight = new Map<string, Promise<string | null>>();
/** Evita reintentos en bucle desde backfill tras un fallo */
const attempted = new Set<string>();

function flightKey(ideaId: string, rawText: string): string {
  return `${ideaId}::${rawText.trim()}`;
}

/**
 * Genera y persiste el título (+ concepto de miniatura) con IA si falta.
 * Deduplica peticiones concurrentes y no toca updatedAt (no reordena listas).
 */
export function ensureIdeaTitle(
  idea: Idea,
  opts?: { force?: boolean }
): Promise<string | null> {
  const existing = idea.title?.trim();
  if (existing && !opts?.force) return Promise.resolve(existing);
  if (!idea.rawText.trim()) return Promise.resolve(null);

  const key = flightKey(idea.id, idea.rawText);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = requestTitle(idea, Boolean(opts?.force)).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, request);
  return request;
}

async function requestTitle(
  idea: Idea,
  force: boolean
): Promise<string | null> {
  const requestText = idea.rawText.trim();
  attempted.add(idea.id);
  try {
    const res = await fetch("/api/generate-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaText: idea.rawText }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnailIdea?: string;
    };
    const title = data.title?.trim();
    if (!title) return null;
    const thumbnailIdea = data.thumbnailIdea?.trim() || undefined;

    // Merge atómico: descarta si el texto cambió (respuesta stale)
    const next = patchIdea(idea.id, (current) => {
      if (current.rawText.trim() !== requestText) return {};
      if (!force && current.title?.trim()) return {};
      return {
        title,
        ...(thumbnailIdea ? { thumbnailIdea } : {}),
      };
    });
    return next?.title?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Genera títulos en segundo plano para las ideas que no tienen
 * y avisa por callback conforme van llegando.
 * No reintenta IDs ya intentados en esta sesión (salvo force en ensureIdeaTitle).
 */
export function backfillIdeaTitles(
  ideas: Idea[],
  onTitle: (id: string, title: string) => void,
  limit = 8
): void {
  ideas
    .filter(
      (i) =>
        !i.title?.trim() &&
        i.rawText.trim() &&
        !attempted.has(i.id) &&
        !inFlight.has(flightKey(i.id, i.rawText))
    )
    .slice(0, limit)
    .forEach((idea) => {
      void ensureIdeaTitle(idea).then((title) => {
        if (title) onTitle(idea.id, title);
      });
    });
}

/** Invalida título/miniatura al editar el texto de la idea (regenera en segundo plano). */
export function invalidateAndRegenerateTitle(
  idea: Idea
): Promise<string | null> {
  attempted.delete(idea.id);
  patchIdea(idea.id, { title: undefined, thumbnailIdea: undefined });
  return ensureIdeaTitle(
    { ...idea, title: undefined, thumbnailIdea: undefined },
    { force: true }
  );
}
