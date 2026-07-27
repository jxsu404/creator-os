import { describe, expect, it } from "vitest";
import {
  normalizeYoutubePackage,
  normalizeYoutubePackages,
} from "./youtube-package";

describe("normalizeYoutubePackage", () => {
  it("acepta un paquete completo", () => {
    const n = normalizeYoutubePackage({
      title: "  Título corto  ",
      description: "Desc útil",
      tags: ["roblox", "afs"],
      thumbnailIdea: "Cara sorprendida + texto OP",
      label: "Keyword primero",
    });
    expect(n).toEqual({
      title: "Título corto",
      description: "Desc útil",
      tags: ["roblox", "afs"],
      thumbnailIdea: "Cara sorprendida + texto OP",
      label: "Keyword primero",
    });
  });

  it("rechaza incompletos", () => {
    expect(
      normalizeYoutubePackage({
        title: "Solo título",
        description: "",
        tags: ["a"],
        thumbnailIdea: "x",
      })
    ).toBeNull();
  });

  it("recorta título a 100", () => {
    const long = "x".repeat(120);
    const n = normalizeYoutubePackage({
      title: long,
      description: "d",
      tags: ["t"],
      thumbnailIdea: "m",
    });
    expect(n?.title).toHaveLength(100);
  });
});

describe("normalizeYoutubePackages", () => {
  it("filtra basura y deja válidos", () => {
    const list = normalizeYoutubePackages([
      {
        title: "A",
        description: "d1",
        tags: ["t"],
        thumbnailIdea: "m1",
      },
      { title: "bad" },
      {
        title: "B",
        description: "d2",
        tags: ["t2"],
        thumbnailIdea: "m2",
      },
    ]);
    expect(list).toHaveLength(2);
    expect(list[0].title).toBe("A");
    expect(list[1].title).toBe("B");
  });
});
