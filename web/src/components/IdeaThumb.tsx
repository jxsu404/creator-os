"use client";

import { resolveIdeaThumbSrc } from "@/lib/idea-thumbs";
import type { Idea } from "@/lib/types";

/**
 * Miniatura de idea:
 * 1) `thumbnailUrl` si el usuario generó/subió una propia (IA futura)
 * 2) imagen fija de la categoría
 */
export function IdeaThumb({
  idea,
  niches = [],
  size = "md",
}: {
  idea: Idea;
  niches?: string[];
  size?: "sm" | "md";
}) {
  const { src, custom } = resolveIdeaThumbSrc(idea, niches);
  const className = `idea-thumb idea-thumb-${size}${
    custom ? " idea-thumb-custom" : ""
  }`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      width={160}
      height={90}
      loading="lazy"
    />
  );
}
