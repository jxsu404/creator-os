import { describe, expect, it } from "vitest";
import { quoteForSession, tipsForSession } from "./home-copy";

describe("home-copy niche session", () => {
  it("returns stable quote for the same seed", () => {
    const a = quoteForSession(["Roblox"], 42);
    const b = quoteForSession(["Roblox"], 42);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });

  it("can differ across seeds", () => {
    const samples = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((s) => quoteForSession(["Gaming"], s))
    );
    expect(samples.size).toBeGreaterThan(1);
  });

  it("returns unique tips up to count", () => {
    const tips = tipsForSession(["Cocina", "Guías"], 3, 99);
    expect(tips).toHaveLength(3);
    const titles = new Set(tips.map((t) => t.title));
    expect(titles.size).toBe(3);
  });
});
