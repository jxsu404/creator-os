import { describe, expect, it } from "vitest";
import {
  buildLongDirectionsPrompt,
  buildLongDraftPrompt,
  IDEA_TOO_THIN_FOR_LONG_MESSAGE,
  isIdeaTooThinForLongPayload,
  isThinLongIdeaText,
  normalizeLongAxis,
  snapLongEstimatedSeconds,
  validateLongDirections,
  validateLongDraft,
} from "./long-generation";
import { TOO_LONG_FOR_SHORT_MESSAGE } from "./short-generation";

const longBody =
  "Ahora te explico este sistema con calma para que no te pierdas al empezar. " +
  "Lo importante es entender para qué sirve cada parte y qué puedes ignorar al principio. " +
  "Con esto ya puedes jugar sin ahogarte en el menú.";

describe("normalizeLongAxis", () => {
  it("accepts canonical axes and aliases", () => {
    expect(normalizeLongAxis("utilidad")).toBe("utilidad");
    expect(normalizeLongAxis("Descubrimiento")).toBe("descubrimiento");
    expect(normalizeLongAxis("journey")).toBe("descubrimiento");
    expect(normalizeLongAxis("mapa")).toBe("mapa");
    expect(normalizeLongAxis("sistemas")).toBe("mapa");
  });

  it("rejects unknown axes", () => {
    expect(normalizeLongAxis("opinion")).toBeNull();
    expect(normalizeLongAxis("")).toBeNull();
  });
});

describe("validateLongDirections", () => {
  const base = [
    {
      axis: "utilidad",
      name: "Solo lo esencial",
      promise: "Sabes qué ignorar al empezar",
      angle: "Prioridades de principiante",
      hook: "Ignora el ochenta por ciento del menú",
      why: "Cuando te abruma la interfaz",
    },
    {
      axis: "descubrimiento",
      name: "Mis primeras horas",
      promise: "Vives el tour conmigo",
      angle: "Journey de descubrimiento",
      hook: "Entré sin saber nada y esto me voló la cabeza",
      why: "Cuando quieres opinión real",
    },
    {
      axis: "mapa",
      name: "Mapa del juego",
      promise: "Entiendes los sistemas clave",
      angle: "Overview por sistemas",
      hook: "Shindo Life se entiende por capas",
      why: "Cuando quieres estructura clara",
    },
  ];

  it("accepts three distinct long axes", () => {
    const result = validateLongDirections(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.directions).toHaveLength(3);
      expect(result.directions[0]).not.toHaveProperty("axis");
    }
  });

  it("rejects duplicate axes", () => {
    const dup = base.map((d, i) =>
      i === 2
        ? { ...d, axis: "utilidad", name: "Otro tip", hook: "Otro hook distinto" }
        : d
    );
    expect(validateLongDirections(dup).ok).toBe(false);
  });
});

describe("snapLongEstimatedSeconds", () => {
  it("snaps to allowed long durations", () => {
    expect(snapLongEstimatedSeconds(200)).toBe(180);
    expect(snapLongEstimatedSeconds(600)).toBe(720);
    expect(snapLongEstimatedSeconds(1000)).toBe(900);
    expect(snapLongEstimatedSeconds(2000)).toBe(1800);
    expect(snapLongEstimatedSeconds(null)).toBe(600);
  });
});

describe("validateLongDraft", () => {
  function makeBlocks(n: number) {
    return Array.from({ length: n }, (_, i) => ({
      title: `Tema ${i + 1}`,
      body: longBody,
    }));
  }

  it("accepts hook + 4–10 blocks + closing", () => {
    const result = validateLongDraft({
      hook: "Si acabas de entrar, esto es lo básico",
      closing: "En el próximo video vamos a lo avanzado",
      blocks: makeBlocks(5),
      estimatedSeconds: 720,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.blocks).toHaveLength(5);
      expect(result.draft.estimatedSeconds).toBe(720);
      expect(result.draft.scriptBody.length).toBeGreaterThan(50);
      expect(result.draft.blocks[0].id).toMatch(/^block_/);
    }
  });

  it("rejects too few blocks", () => {
    const result = validateLongDraft({
      hook: "Hook",
      closing: "Cierre",
      blocks: makeBlocks(2),
      estimatedSeconds: 300,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects thin block bodies", () => {
    const result = validateLongDraft({
      hook: "Hook de entrada al video largo",
      closing: "Cierre",
      blocks: makeBlocks(4).map((b, i) =>
        i === 0 ? { ...b, body: "muy corto" } : b
      ),
      estimatedSeconds: 300,
    });
    expect(result.ok).toBe(false);
  });
});

describe("thin / too-long messaging", () => {
  it("flags thin long ideas for UI warn", () => {
    expect(isThinLongIdeaText("Shindo Life basics")).toBe(true);
    expect(
      isThinLongIdeaText(
        "Primeras horas en Shindo Life: explico customización del personaje, el mapa con muchas aldeas, la UI de vida chakra y estamina, el menú de stats elementos bloodlines y mastery, cómo progresar con misiones y bosses, y la movilidad. Tono: lo estoy descubriendo contigo y al final edito como guía."
      )
    ).toBe(false);
  });

  it("detects thin payload from model", () => {
    expect(isIdeaTooThinForLongPayload({ ideaTooThinForLong: true })).toBe(
      true
    );
    expect(
      isIdeaTooThinForLongPayload({ error: "idea_too_thin_for_long" })
    ).toBe(true);
    expect(IDEA_TOO_THIN_FOR_LONG_MESSAGE.length).toBeGreaterThan(20);
  });

  it("short too-long message points to YouTube largo", () => {
    expect(TOO_LONG_FOR_SHORT_MESSAGE).toMatch(/YouTube largo/);
  });
});

describe("long prompts", () => {
  it("buildLongDirectionsPrompt mentions blocks axes", () => {
    const prompt = buildLongDirectionsPrompt("Idea de prueba larga");
    expect(prompt).toMatch(/descubrimiento/);
    expect(prompt).toMatch(/mapa/);
    expect(prompt).toMatch(/ideaTooThinForLong/);
  });

  it("buildLongDraftPrompt forbids camera plans and asks blocks", () => {
    const prompt = buildLongDraftPrompt({
      ideaText: "Idea larga de prueba con varios temas",
      direction: {
        name: "Tour",
        promise: "Entiendes lo básico",
        angle: "Descubrimiento",
        hook: "Entré sin saber nada",
        why: "Para noobs",
      },
      isRevision: false,
    });
    expect(prompt).toMatch(/blocks/);
    expect(prompt).toMatch(/PROHIBIDO/);
    expect(prompt).not.toMatch(/plan de cámara obligatorio/);
  });
});
