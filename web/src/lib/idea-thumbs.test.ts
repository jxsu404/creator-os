import { describe, expect, it } from "vitest";
import {
  categorySlug,
  categoryThumbSrc,
  resolveIdeaThumbSrc,
} from "./idea-thumbs";

describe("idea-thumbs", () => {
  it("maps niche chips to stock assets", () => {
    expect(categorySlug("Gaming")).toBe("gaming");
    expect(categorySlug("Guías")).toBe("guias");
    expect(categorySlug("")).toBe("default");
    expect(categoryThumbSrc("Fitness")).toBe("/thumbs/fitness.png");
  });

  it("prefers custom thumbnailUrl over category stock", () => {
    const custom = resolveIdeaThumbSrc(
      { category: "Gaming", thumbnailUrl: "https://cdn.example/ai.png" },
      ["Fitness"]
    );
    expect(custom).toEqual({
      src: "https://cdn.example/ai.png",
      custom: true,
    });

    const stock = resolveIdeaThumbSrc({ category: "Cocina" }, []);
    expect(stock).toEqual({ src: "/thumbs/cocina.png", custom: false });

    const fromProfile = resolveIdeaThumbSrc({}, ["Tech", "Gaming"]);
    expect(fromProfile.src).toBe("/thumbs/tech.png");
  });
});
