import { describe, expect, it } from "vitest";
import { profileContextFor } from "./profile-context";
import type { CreatorProfile } from "./types";

function blankProfile(over: Partial<CreatorProfile> = {}): CreatorProfile {
  return {
    niches: ["Vlogs"],
    customDescription: "",
    onboardedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    workspaceMode: "blank",
    useGameContext: false,
    ...over,
  };
}

describe("profileContextFor — personalización", () => {
  it("incluye voz y ritmo aunque useGameContext sea false (no-gaming)", () => {
    const ctx = profileContextFor(
      blankProfile({
        recordingStyle: {
          howIRecord: "Hablo a cámara",
          typicalShots: [],
          voiceAndPacing: "En todos mis videos incluyo un saludo",
          avoid: [],
          videoTypes: [],
        },
      })
    );

    expect(ctx).toContain("ASÍ SUENA TU CONTENIDO (obligatorio)");
    expect(ctx).toContain("En todos mis videos incluyo un saludo");
    expect(ctx).toContain("Voz y ritmo (tono al escribir el guion");
    expect(ctx).not.toContain("CONTEXTO DEL JUEGO");
  });

  it("sigue incluyendo estilo cuando Gaming tiene useGameContext false", () => {
    const ctx = profileContextFor(
      blankProfile({
        niches: ["Gaming"],
        useGameContext: false,
        recordingStyle: {
          howIRecord: "",
          typicalShots: [],
          voiceAndPacing: "Empiezo con hola familia",
          avoid: [],
          videoTypes: [],
        },
      })
    );

    expect(ctx).toContain("Empiezo con hola familia");
  });

  it("incluye descripciones de YouTube cuando están definidas", () => {
    const ctx = profileContextFor(
      blankProfile({
        recordingStyle: {
          howIRecord: "",
          typicalShots: [],
          voiceAndPacing: "",
          youtubeDescriptionStyle:
            "Gancho en la primera línea, hashtags al final",
          avoid: [],
          videoTypes: [],
        },
      })
    );

    expect(ctx).toContain("Descripciones de YouTube");
    expect(ctx).toContain("Gancho en la primera línea");
  });
});
