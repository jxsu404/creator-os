import { describe, expect, it } from "vitest";
import { THUMBNAIL_STYLE_PROMPT_MAX } from "@/lib/thumbnail-prompt";
import { thumbFilename, MAX_REFERENCE_IMAGES } from "@/lib/image-compress";

describe("thumbnail gallery helpers", () => {
  it("allows style prompts up to 5000 chars", () => {
    expect(THUMBNAIL_STYLE_PROMPT_MAX).toBe(5000);
  });

  it("caps reference images at 3", () => {
    expect(MAX_REFERENCE_IMAGES).toBe(3);
  });

  it("builds a safe download filename", () => {
    expect(thumbFilename("Mi Video OP!!")).toMatch(/^mi-video-op-\d+\.jpg$/);
    expect(thumbFilename("")).toMatch(/^miniatura-\d+\.jpg$/);
  });
});
