import { describe, expect, it } from "vitest";
import {
  parseTrelloBoardToPack,
  splitLongBody,
} from "@/lib/game-knowledge/trello-parse";
import {
  formatKnowledgeForAi,
  retrieveKnowledgeContext,
  searchKnowledgeChunks,
  tokenizeQuery,
} from "@/lib/game-knowledge/retrieve";

const sampleBoard = {
  id: "board1",
  name: "AFS Official Trello",
  lists: [
    { id: "l1", name: "Trello Team" },
    { id: "l2", name: "Powers" },
    { id: "l3", name: "Bosses" },
  ],
  cards: [
    {
      id: "c0",
      name: "Help",
      desc: "Reach me on Discord",
      idList: "l1",
      pos: 1,
    },
    {
      id: "c1",
      name: "Perfect Susanoo",
      desc: "Craft at Madara NPC. #1 meta chakra power.",
      idList: "l2",
      pos: 1,
    },
    {
      id: "c2",
      name: "Kurama",
      desc: "World boss. Drops materials for fox path.",
      idList: "l3",
      pos: 1,
    },
  ],
};

describe("trello-parse", () => {
  it("skips admin lists and builds searchable chunks", () => {
    const pack = parseTrelloBoardToPack(sampleBoard, {
      syncedAt: "2026-07-30T00:00:00.000Z",
    });
    expect(pack.lists).toEqual(["Powers", "Bosses"]);
    expect(pack.chunks).toHaveLength(2);
    expect(pack.chunks[0].title).toBe("Perfect Susanoo");
    expect(pack.chunks[0].haystack).toContain("susanoo");
  });

  it("splits long bodies by markdown headings", () => {
    const body = `${"x".repeat(100)}\n## Section A\n${"a".repeat(50)}\n## Section B\n${"b".repeat(50)}`;
    const parts = splitLongBody("Update 5", body, 80);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.some((p) => p.title.includes("Section"))).toBe(true);
  });
});

describe("retrieve", () => {
  const pack = parseTrelloBoardToPack(sampleBoard);

  it("tokenizes useful query words", () => {
    expect(tokenizeQuery("Guía Susanoo Perfecto en AFS")).toContain("susanoo");
    expect(tokenizeQuery("Guía Susanoo Perfecto en AFS")).not.toContain("guia");
  });

  it("ranks Susanoo above Kurama for susanoo query", () => {
    const hits = searchKnowledgeChunks(pack, "cómo farmear Susanoo Perfecto", 5);
    expect(hits[0]?.title).toMatch(/Susanoo/i);
  });

  it("formats AI block within budget", () => {
    const text = retrieveKnowledgeContext(pack, "Susanoo", 400);
    expect(text).toContain("CONOCIMIENTO AFS");
    expect(text).toContain("Susanoo");
    expect(text.length).toBeLessThanOrEqual(400);
  });

  it("returns empty when no chunks", () => {
    expect(formatKnowledgeForAi([], 500)).toBe("");
  });
});
