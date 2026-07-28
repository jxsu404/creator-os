import { describe, expect, it } from "vitest";
import { ideaHref } from "./idea-href";
import { isDirectScriptFlow, resolveIdeaFlow } from "./idea-flow";
import type { Idea } from "./types";

function baseIdea(partial: Partial<Idea> = {}): Idea {
  return {
    id: "idea_1",
    rawText: "Outline decidido",
    status: "captured",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("ideaFlow", () => {
  it("defaults to explore", () => {
    expect(resolveIdeaFlow({})).toBe("explore");
    expect(isDirectScriptFlow({})).toBe(false);
  });

  it("detects direct", () => {
    expect(resolveIdeaFlow({ ideaFlow: "direct" })).toBe("direct");
    expect(isDirectScriptFlow({ ideaFlow: "direct" })).toBe(true);
  });
});

describe("ideaHref with direct flow", () => {
  it("sends captured direct ideas to /direct", () => {
    expect(ideaHref(baseIdea({ ideaFlow: "direct" }))).toBe(
      "/ideas/idea_1/direct"
    );
  });

  it("keeps explore ideas on detail", () => {
    expect(ideaHref(baseIdea())).toBe("/ideas/idea_1");
  });

  it("prefers draft when present", () => {
    expect(
      ideaHref(
        baseIdea({
          ideaFlow: "direct",
          status: "in_progress",
          draft: {
            format: "guide",
            hook: "h",
            scriptBody: "b",
            closing: "c",
            beats: [],
            estimatedSeconds: 60,
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        })
      )
    ).toBe("/ideas/idea_1/draft");
  });
});
