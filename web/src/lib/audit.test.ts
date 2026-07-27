import { describe, expect, it } from "vitest";
import { hasGamingNiche } from "./profile-context";
import { sanitizeNext } from "./safe-next";
import { mergeIdeas, mergeProfiles } from "./sync";
import type { CreatorProfile, Idea } from "./types";

describe("hasGamingNiche", () => {
  it("unlocks only when Gaming chip is present", () => {
    expect(hasGamingNiche({ niches: ["Gaming"] })).toBe(true);
    expect(hasGamingNiche({ niches: ["Roblox", "Gaming"] })).toBe(true);
    expect(hasGamingNiche({ niches: ["gaming"] })).toBe(true);
    expect(hasGamingNiche({ niches: ["Roblox", "Guías"] })).toBe(false);
    expect(hasGamingNiche({ niches: ["Fitness"] })).toBe(false);
    expect(hasGamingNiche({ niches: [] })).toBe(false);
  });
});

describe("sanitizeNext", () => {
  it("allows app-relative paths", () => {
    expect(sanitizeNext("/ideas/abc")).toBe("/ideas/abc");
    expect(sanitizeNext("/")).toBe("/");
  });

  it("rejects open redirects and protocols", () => {
    expect(sanitizeNext("//evil.com")).toBe("/");
    expect(sanitizeNext("https://evil.com")).toBe("/");
    expect(sanitizeNext("javascript:alert(1)")).toBe("/");
    expect(sanitizeNext("evil.com")).toBe("/");
  });
});

describe("mergeIdeas", () => {
  it("keeps the newer updatedAt", () => {
    const local: Idea[] = [
      {
        id: "1",
        rawText: "local",
        status: "captured",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];
    const remote: Idea[] = [
      {
        id: "1",
        rawText: "remote",
        status: "captured",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ];
    const merged = mergeIdeas(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].rawText).toBe("remote");
  });
});

describe("mergeProfiles", () => {
  it("uses updatedAt instead of onboardedAt for last-write-wins", () => {
    const local: CreatorProfile = {
      niches: ["Gaming"],
      customDescription: "local edit",
      onboardedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
      workspaceMode: "blank",
      brand: {
        creatorName: "Ella",
        community: "",
        kick: "",
        streamSchedule: "",
        sponsor: "",
        ctaSubscribe: "",
        ctaDiscord: "",
        ctaCrossPlatform: "",
      },
    };
    const remote: CreatorProfile = {
      niches: ["Gaming"],
      customDescription: "stale remote",
      onboardedAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      workspaceMode: "blank",
      brand: {
        creatorName: "Otro",
        community: "",
        kick: "",
        streamSchedule: "",
        sponsor: "",
        ctaSubscribe: "",
        ctaDiscord: "",
        ctaCrossPlatform: "",
      },
    };
    const merged = mergeProfiles(local, remote);
    expect(merged?.customDescription).toBe("local edit");
    expect(merged?.brand?.creatorName).toBe("Ella");
  });
});
