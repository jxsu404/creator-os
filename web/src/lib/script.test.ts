import { describe, expect, it } from "vitest";
import {
  buildUnifiedScript,
  formatEstimatedDuration,
  joinBlockBodies,
} from "./script";

describe("buildUnifiedScript", () => {
  it("joins hook body closing for short drafts", () => {
    expect(
      buildUnifiedScript({
        hook: "Hook",
        scriptBody: "Cuerpo",
        closing: "Cierre",
      })
    ).toBe("Hook\n\nCuerpo\n\nCierre");
  });

  it("uses thematic blocks with ## titles for long drafts", () => {
    const text = buildUnifiedScript({
      hook: "Gancho",
      scriptBody: "ignored when blocks exist",
      closing: "Cierre",
      blocks: [
        { id: "b1", title: "Mapa", body: "El mapa es enorme." },
        { id: "b2", title: "Menú", body: "Empieza por stats." },
      ],
    });
    expect(text).toContain("Gancho");
    expect(text).toContain("## Mapa");
    expect(text).toContain("El mapa es enorme.");
    expect(text).toContain("## Menú");
    expect(text).toContain("Cierre");
    expect(text).not.toContain("ignored");
  });
});

describe("joinBlockBodies / formatEstimatedDuration", () => {
  it("joins bodies", () => {
    expect(
      joinBlockBodies([
        { id: "1", title: "A", body: "uno" },
        { id: "2", title: "B", body: "dos" },
      ])
    ).toBe("uno\n\ndos");
  });

  it("formats short vs long durations", () => {
    expect(formatEstimatedDuration(90)).toBe("~90s");
    expect(formatEstimatedDuration(600)).toBe("~10 min");
  });
});
