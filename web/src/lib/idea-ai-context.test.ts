import { describe, expect, it } from "vitest";
import { ideaAiContextFromProfile } from "./idea-ai-context";
import type { CreatorProfile } from "./types";

function baseProfile(over: Partial<CreatorProfile> = {}): CreatorProfile {
  return {
    niches: ["Gaming"],
    customDescription: "Roblox con humor",
    onboardedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("ideaAiContextFromProfile", () => {
  it("returns empty string without profile", () => {
    expect(
      ideaAiContextFromProfile(null, { gameId: "g1", contentAngle: "Guide" })
    ).toBe("");
    expect(ideaAiContextFromProfile(undefined, {})).toBe("");
  });

  it("includes niche context and prioritizes idea game when present", () => {
    const profile = baseProfile({
      gamesLibrary: [
        {
          id: "g1",
          name: "Anime Fighters",
          whatItIs: "Juego de combates",
          loop: "PvP rápido",
          terms: ["gemas"],
          doNotInvent: [],
          latestUpdate: "",
        },
      ],
    });
    const ctx = ideaAiContextFromProfile(profile, {
      gameId: "g1",
      contentAngle: "Update",
    });
    expect(ctx).toContain("Gaming");
    expect(ctx).toContain("Anime Fighters");
    expect(ctx).toContain("Update");
  });
});
