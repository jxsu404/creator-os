import { describe, expect, it } from "vitest";
import { AI_INPUT_CAPS, clampAiText } from "@/lib/ai-input";

describe("clampAiText", () => {
  it("returns short text unchanged", () => {
    expect(clampAiText("hola", 10)).toBe("hola");
  });

  it("trims at a word boundary when possible", () => {
    const out = clampAiText("uno dos tres cuatro cinco", 14);
    expect(out.length).toBeLessThanOrEqual(14);
    expect(out).toBe("uno dos tres");
  });

  it("hard-cuts when there is no good break", () => {
    expect(clampAiText("abcdefghij", 4)).toBe("abcd");
  });

  it("profile context cap is above legacy 3k", () => {
    expect(AI_INPUT_CAPS.profileContext).toBeGreaterThanOrEqual(4000);
  });
});
