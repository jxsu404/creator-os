import { describe, expect, it } from "vitest";
import {
  buildDirectionsPrompt,
  buildDraftPrompt,
  clampEstimatedSeconds,
  countWords,
  isTooLongForShortPayload,
  normalizeAxis,
  snapEstimatedSeconds,
  TOO_LONG_FOR_SHORT_MESSAGE,
  validateShortDirections,
  validateShortDraft,
} from "./short-generation";

describe("normalizeAxis", () => {
  it("accepts the three canonical axes and aliases", () => {
    expect(normalizeAxis("utilidad")).toBe("utilidad");
    expect(normalizeAxis("Opinión")).toBe("opinion");
    expect(normalizeAxis("HISTORIA")).toBe("historia");
    expect(normalizeAxis("practico")).toBe("utilidad");
    expect(normalizeAxis("controvertido")).toBe("opinion");
  });

  it("rejects unknown axes", () => {
    expect(normalizeAxis("tutorial")).toBeNull();
    expect(normalizeAxis("")).toBeNull();
  });
});

describe("validateShortDirections", () => {
  const base = [
    {
      axis: "utilidad",
      name: "Error invisible",
      promise: "Detectas el fallo real",
      angle: "Tip técnico rápido",
      hook: "No es falta de fuerza",
      why: "Cuando quieres corregir un error",
    },
    {
      axis: "opinion",
      name: "Mito del press",
      promise: "Dejas de creer el consejo malo",
      angle: "Mito vs realidad",
      hook: "Ese tip del gym te está frenando",
      why: "Cuando hay mucho consejo basura",
    },
    {
      axis: "historia",
      name: "Mi primer fallo",
      promise: "Ves el antes y después",
      angle: "Anécdota personal",
      hook: "Me lesioné por ignorar esto",
      why: "Cuando quieres conectar en emoción",
    },
  ];

  it("accepts three distinct axes", () => {
    const result = validateShortDirections(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.directions).toHaveLength(3);
      expect(result.directions[0]).not.toHaveProperty("axis");
    }
  });

  it("rejects duplicate axes", () => {
    const dup = base.map((d, i) =>
      i === 2 ? { ...d, axis: "utilidad", name: "Otro tip", hook: "Otro hook" } : d
    );
    const result = validateShortDirections(dup);
    expect(result.ok).toBe(false);
  });

  it("rejects incomplete rows", () => {
    const result = validateShortDirections([
      base[0],
      { ...base[1], hook: "" },
      base[2],
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("validateShortDraft", () => {
  it("accepts a draft and snaps duration to allowed buckets", () => {
    const body = Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(" ");
    const result = validateShortDraft({
      hook: "Esto cambia tu press hoy",
      scriptBody: body,
      closing: "Pruébalo en tu próxima serie",
      estimatedSeconds: 100,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.estimatedSeconds).toBe(90);
    }
  });

  it("allows longer bodies for denser shorts up to ~2:30", () => {
    const body = Array.from({ length: 250 }, (_, i) => `palabra${i}`).join(" ");
    const result = validateShortDraft({
      hook: "Hook",
      scriptBody: body,
      closing: "Cierre",
      estimatedSeconds: 150,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.estimatedSeconds).toBe(150);
    }
  });

  it("rejects bodies that exceed the short hard cap", () => {
    const body = Array.from({ length: 450 }, (_, i) => `palabra${i}`).join(" ");
    const result = validateShortDraft({
      hook: "Hook",
      scriptBody: body,
      closing: "Cierre",
      estimatedSeconds: 150,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(TOO_LONG_FOR_SHORT_MESSAGE);
    }
  });

  it("rejects missing hook", () => {
    const result = validateShortDraft({
      hook: "  ",
      scriptBody:
        "Un cuerpo con suficiente texto para pasar el mínimo de palabras aquí mismo.",
      closing: "Ciao",
    });
    expect(result.ok).toBe(false);
  });
});

describe("helpers", () => {
  it("counts words", () => {
    expect(countWords("  hola mundo  ")).toBe(2);
  });

  it("snaps estimated seconds to 30/60/90/120/150", () => {
    expect(snapEstimatedSeconds(10)).toBe(30);
    expect(snapEstimatedSeconds(45)).toBe(60);
    expect(snapEstimatedSeconds(75)).toBe(90);
    expect(snapEstimatedSeconds(100)).toBe(90);
    expect(snapEstimatedSeconds(140)).toBe(150);
    expect(snapEstimatedSeconds(undefined)).toBe(60);
    expect(clampEstimatedSeconds(120)).toBe(120);
  });

  it("detects tooLongForShort payloads", () => {
    expect(isTooLongForShortPayload({ tooLongForShort: true })).toBe(true);
    expect(isTooLongForShortPayload({ error: "too_long_for_short" })).toBe(true);
    expect(isTooLongForShortPayload({ hook: "x" })).toBe(false);
  });

  it("builds prompts that mention duration buckets and too-long escape", () => {
    const dirPrompt = buildDirectionsPrompt("idea de prueba", "Gaming");
    expect(dirPrompt).toContain("utilidad");
    expect(dirPrompt).toContain("150");
    expect(dirPrompt).toContain("tooLongForShort");
    expect(dirPrompt).toContain("idea de prueba");

    const draftPrompt = buildDraftPrompt({
      ideaText: "mi idea",
      direction: {
        name: "A",
        promise: "B",
        angle: "C",
        hook: "hook base",
        why: "D",
      },
      isRevision: false,
    });
    expect(draftPrompt).toContain("NO lo traiciones");
    expect(draftPrompt).toContain("hook base");
    expect(draftPrompt).toContain("30, 60, 90, 120 o 150");
    expect(draftPrompt).toContain("tooLongForShort");
  });
});
