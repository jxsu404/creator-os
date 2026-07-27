import { describe, expect, it } from "vitest";
import {
  buildThumbnailPrompt,
  DEFAULT_THUMBNAIL_STYLE_PROMPT,
} from "@/lib/thumbnail-prompt";

describe("buildThumbnailPrompt", () => {
  it("uses default style when none provided", () => {
    const prompt = buildThumbnailPrompt({
      thumbnailIdea: "Cara sorprendida + texto OP",
    });
    expect(prompt).toContain(DEFAULT_THUMBNAIL_STYLE_PROMPT.slice(0, 40));
    expect(prompt).toContain("Thumbnail concept: Cara sorprendida + texto OP");
  });

  it("prefers custom style prompt", () => {
    const prompt = buildThumbnailPrompt({
      stylePrompt: "Estilo anime, colores neón, sin texto.",
      thumbnailIdea: "Boss fight",
      title: "Tier list",
      extraInstructions: "Más contraste",
    });
    expect(prompt).toContain("Estilo anime, colores neón, sin texto.");
    expect(prompt).not.toContain("Create a YouTube thumbnail");
    expect(prompt).toContain("Video title: Tier list");
    expect(prompt).toContain("Extra instructions from creator: Más contraste");
  });
});
