import { ideaThumbnailConcept, ideaTitle } from "@/lib/idea-title";
import type { Idea } from "@/lib/types";

/** Hash estable → tono visual de la miniatura mock. */
export function thumbTone(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % 5;
}

/**
 * Miniatura de idea: imagen real si existe URL;
 * si no, preview tipo YouTube a partir del título + concepto.
 */
export function IdeaThumb({
  idea,
  size = "md",
}: {
  idea: Idea;
  size?: "sm" | "md";
}) {
  const url = idea.thumbnailUrl?.trim();
  const className = `idea-thumb idea-thumb-${size}`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={className} width={160} height={90} />
    );
  }

  const title = ideaTitle(idea, size === "sm" ? 36 : 42);
  const concept = ideaThumbnailConcept(idea);
  const tone = thumbTone(idea.id);

  return (
    <div
      className={`${className} idea-thumb-mock idea-thumb-tone-${tone}`}
      aria-hidden
    >
      <div className="idea-thumb-glow" />
      <p className="idea-thumb-title">{title}</p>
      {concept ? <p className="idea-thumb-concept">{concept}</p> : null}
    </div>
  );
}
