import { describe, expect, it } from "vitest";
import {
  buildTipsContext,
  isHomeTipsCacheFresh,
  normalizeTips,
  type HomeTipsCache,
} from "./tips-context";
import type { CreatorProfile, Idea } from "./types";

function baseProfile(over: Partial<CreatorProfile> = {}): CreatorProfile {
  return {
    niches: ["Gaming", "Roblox"],
    customDescription: "Guías de Roblox con humor",
    onboardedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function idea(over: Partial<Idea> & Pick<Idea, "id" | "rawText" | "status">): Idea {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...over,
  };
}

describe("buildTipsContext", () => {
  it("is stable for the same profile + ideas", () => {
    const profile = baseProfile({
      youtubeCache: {
        fetchedAt: "2026-07-01T00:00:00.000Z",
        videos: [
          {
            id: "yt1",
            title: "Update AFS",
            url: "https://youtube.com/watch?v=yt1",
            publishedAt: "2026-06-01T00:00:00.000Z",
            thumbnailUrl: "",
            viewCount: 1200,
          },
        ],
      },
    });
    const ideas = [
      idea({
        id: "i1",
        rawText: "errores comunes",
        title: "Errores AFS",
        status: "recorded",
        draft: {
          format: "guide",
          hook: "Si fallas esto, pierdes gemas",
          scriptBody: "...",
          closing: "...",
          beats: [],
          estimatedSeconds: 45,
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      }),
    ];
    const a = buildTipsContext(profile, ideas);
    const b = buildTipsContext(profile, ideas);
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.hasRecentSignal).toBe(true);
    expect(a.recentContent).toContain("YouTube");
    expect(a.recentContent).toContain("Update AFS");
    expect(a.recentContent).toContain("Grabadas");
    expect(a.recentContent).toContain("Errores AFS");
    expect(a.recentContent).toContain("hook:");
  });

  it("mixes youtube and recorded; empty means no recent signal", () => {
    const withBoth = buildTipsContext(
      baseProfile({
        youtubeCache: {
          fetchedAt: "2026-07-01T00:00:00.000Z",
          videos: [
            {
              id: "a",
              title: "Clip 1",
              url: "https://youtube.com/watch?v=a",
              publishedAt: "2026-06-01T00:00:00.000Z",
              thumbnailUrl: "",
            },
          ],
        },
      }),
      [idea({ id: "r1", rawText: "grabé esto", status: "recorded" })]
    );
    expect(withBoth.hasRecentSignal).toBe(true);
    expect(withBoth.recentContent).toContain("Clip 1");
    expect(withBoth.recentContent).toContain("grabé esto");

    const empty = buildTipsContext(baseProfile(), [
      idea({ id: "c1", rawText: "solo capturada", status: "captured" }),
    ]);
    expect(empty.hasRecentSignal).toBe(false);
    expect(empty.recentContent).toBe("");
    expect(empty.fingerprint.length).toBeGreaterThan(0);
  });

  it("changes fingerprint when niche or videos change", () => {
    const base = buildTipsContext(baseProfile(), []);
    const otherNiche = buildTipsContext(
      baseProfile({ niches: ["Cocina"] }),
      []
    );
    expect(base.fingerprint).not.toBe(otherNiche.fingerprint);

    const withYt = buildTipsContext(
      baseProfile({
        youtubeCache: {
          fetchedAt: "2026-07-01T00:00:00.000Z",
          videos: [
            {
              id: "z",
              title: "Nuevo",
              url: "https://youtube.com/watch?v=z",
              publishedAt: "2026-06-01T00:00:00.000Z",
              thumbnailUrl: "",
            },
          ],
        },
      }),
      []
    );
    expect(base.fingerprint).not.toBe(withYt.fingerprint);
  });
});

describe("isHomeTipsCacheFresh", () => {
  it("requires matching fingerprint and TTL", () => {
    const cache: HomeTipsCache = {
      fingerprint: "abc",
      generatedAt: new Date(Date.now() - 1000).toISOString(),
      tips: [
        { title: "A", body: "1" },
        { title: "B", body: "2" },
        { title: "C", body: "3" },
      ],
    };
    expect(isHomeTipsCacheFresh(cache, "abc")).toBe(true);
    expect(isHomeTipsCacheFresh(cache, "other")).toBe(false);
    expect(
      isHomeTipsCacheFresh(
        cache,
        "abc",
        Date.now() + 25 * 60 * 60 * 1000
      )
    ).toBe(false);
  });
});

describe("normalizeTips", () => {
  it("keeps only valid title+body and caps at 3", () => {
    expect(
      normalizeTips([
        { title: " Uno ", body: " cuerpo " },
        { title: "", body: "x" },
        { title: "Dos", body: "y" },
        { title: "Tres", body: "z" },
        { title: "Cuatro", body: "w" },
      ])
    ).toEqual([
      { title: "Uno", body: "cuerpo" },
      { title: "Dos", body: "y" },
      { title: "Tres", body: "z" },
    ]);
    expect(normalizeTips(null)).toEqual([]);
  });
});
