import { describe, expect, it } from "vitest";
import { groupIdeasByStatus, ideaStatusGroup } from "./idea-labels";
import type { Idea } from "./types";

function idea(partial: Partial<Idea> & Pick<Idea, "id" | "status">): Idea {
  return {
    rawText: "x",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...partial,
  };
}

describe("idea-labels", () => {
  it("maps statuses to pending / ready / recorded groups", () => {
    expect(ideaStatusGroup("captured")).toBe("pending");
    expect(ideaStatusGroup("in_progress")).toBe("pending");
    expect(ideaStatusGroup("ready")).toBe("ready");
    expect(ideaStatusGroup("recorded")).toBe("recorded");
    expect(ideaStatusGroup("archived")).toBeNull();
  });

  it("groups ideas by status bucket", () => {
    const groups = groupIdeasByStatus([
      idea({ id: "1", status: "captured" }),
      idea({ id: "2", status: "ready" }),
      idea({ id: "3", status: "recorded" }),
      idea({ id: "4", status: "in_progress" }),
      idea({ id: "5", status: "archived" }),
    ]);
    expect(groups.pending.map((i) => i.id)).toEqual(["1", "4"]);
    expect(groups.ready.map((i) => i.id)).toEqual(["2"]);
    expect(groups.recorded.map((i) => i.id)).toEqual(["3"]);
  });
});
