import type { BrandKitStored, CreatorProfile, GameBrief, RecordingStyle } from "./types";
import { PROVEN_HOOKS } from "./content-os-seed";
import {
  DEFAULT_BRAND,
  DEFAULT_GAME_BRIEF,
  DEFAULT_GAMES_LIBRARY,
  DEFAULT_RECORDING_STYLE,
} from "./user1-defaults";

export const BLANK_BRAND: BrandKitStored = {
  creatorName: "",
  community: "",
  kick: "",
  streamSchedule: "",
  sponsor: "",
  ctaSubscribe: "",
  ctaDiscord: "",
  ctaCrossPlatform: "",
};

export const BLANK_RECORDING_STYLE: RecordingStyle = {
  howIRecord: "",
  typicalShots: [],
  voiceAndPacing: "",
  youtubeDescriptionStyle: "",
  avoid: [],
  videoTypes: [],
};

function mergeBrief(base: GameBrief, over?: Partial<GameBrief>): GameBrief {
  return {
    ...base,
    ...over,
    id: over?.id || base.id,
    terms: over?.terms?.length ? over.terms : base.terms,
    doNotInvent: over?.doNotInvent?.length ? over.doNotInvent : base.doNotInvent,
    latestUpdate: over?.latestUpdate ?? base.latestUpdate,
    latestUpdateAt: over?.latestUpdateAt ?? base.latestUpdateAt,
  };
}

/**
 * blank = canal propio (nuevos usuarios).
 * content_os = perfil con biblioteca importada del fundador.
 */
export function resolveWorkspaceMode(profile: CreatorProfile): "blank" | "content_os" {
  if (profile.workspaceMode === "content_os" || profile.workspaceMode === "blank") {
    return profile.workspaceMode;
  }
  // Legacy: perfiles que ya traían brand/juegos del fundador
  const name = profile.brand?.creatorName?.trim().toLowerCase() || "";
  const hasFounderBrand =
    name.includes("josué") ||
    name.includes("josue") ||
    (profile.brand?.community || "").toLowerCase().includes("crimson");
  const hasAfs = (profile.gamesLibrary || []).some(
    (g) => g.id === "anime-fighting-simulator"
  );
  if (hasFounderBrand || hasAfs) return "content_os";
  return "blank";
}

/** True si el creador eligió el chip Gaming (onboarding / nichos). */
export function hasGamingNiche(profile: Pick<CreatorProfile, "niches">): boolean {
  return (profile.niches || []).some(
    (n) => n.trim().toLowerCase() === "gaming"
  );
}

function normalizeBlank(profile: CreatorProfile): CreatorProfile {
  const gamesLibrary = profile.gamesLibrary?.length
    ? profile.gamesLibrary
    : [];
  const activeGameId =
    profile.activeGameId ||
    profile.gameBrief?.id ||
    gamesLibrary[0]?.id ||
    undefined;
  const gameBrief =
    profile.gameBrief ||
    gamesLibrary.find((g) => g.id === activeGameId) ||
    undefined;

  return {
    ...profile,
    workspaceMode: "blank",
    niches: profile.niches || [],
    customDescription: (profile.customDescription || "").trim(),
    useGameContext:
      hasGamingNiche(profile) &&
      (profile.useGameContext === true ||
        Boolean(gameBrief) ||
        gamesLibrary.length > 0),
    activeGameId,
    gamesLibrary,
    gameBrief,
    recordingStyle: {
      ...BLANK_RECORDING_STYLE,
      ...profile.recordingStyle,
      typicalShots: profile.recordingStyle?.typicalShots || [],
      avoid: profile.recordingStyle?.avoid || [],
      videoTypes: profile.recordingStyle?.videoTypes || [],
    },
    brand: {
      ...BLANK_BRAND,
      ...profile.brand,
    },
    provenHooks: profile.provenHooks || [],
    youtube: profile.youtube ?? null,
    youtubeCache: profile.youtubeCache ?? null,
  };
}

function normalizeContentOs(profile: CreatorProfile): CreatorProfile {
  const libraryMap = new Map<string, GameBrief>();
  for (const g of DEFAULT_GAMES_LIBRARY) libraryMap.set(g.id, g);
  for (const g of profile.gamesLibrary || []) {
    const base = libraryMap.get(g.id) || g;
    libraryMap.set(g.id, mergeBrief(base, g));
  }
  const gamesLibrary = Array.from(libraryMap.values());

  const activeGameId =
    profile.activeGameId ||
    profile.gameBrief?.id ||
    DEFAULT_GAME_BRIEF.id;

  const fromLibrary = gamesLibrary.find((g) => g.id === activeGameId);
  const gameBrief = mergeBrief(
    fromLibrary || DEFAULT_GAME_BRIEF,
    profile.gameBrief?.id === activeGameId ? profile.gameBrief : fromLibrary
  );

  const niches =
    (profile.niches?.length ?? 0) > 0
      ? profile.niches
      : ["Gaming", "Roblox", "Guías", "Showcases", "Opiniones"];

  return {
    ...profile,
    workspaceMode: "content_os",
    niches,
    useGameContext:
      hasGamingNiche({ niches }) && profile.useGameContext !== false,
    activeGameId,
    gamesLibrary,
    gameBrief,
    recordingStyle: {
      ...DEFAULT_RECORDING_STYLE,
      ...profile.recordingStyle,
      typicalShots: profile.recordingStyle?.typicalShots?.length
        ? profile.recordingStyle.typicalShots
        : DEFAULT_RECORDING_STYLE.typicalShots,
      avoid: profile.recordingStyle?.avoid?.length
        ? profile.recordingStyle.avoid
        : DEFAULT_RECORDING_STYLE.avoid,
      videoTypes: profile.recordingStyle?.videoTypes?.length
        ? profile.recordingStyle.videoTypes
        : DEFAULT_RECORDING_STYLE.videoTypes,
    },
    brand: {
      ...DEFAULT_BRAND,
      ...profile.brand,
    },
    provenHooks: profile.provenHooks?.length
      ? profile.provenHooks
      : PROVEN_HOOKS,
    customDescription:
      (profile.customDescription ?? "").trim() ||
      "Roblox en español — Anime Fighting Simulator (primario), Shindo Life, Blox Lock upcoming. Comunidad Crimson Core. YouTube + Shorts + TikTok + Kick.",
  };
}

/**
 * Normaliza perfil según workspace.
 * blank = sin datos del fundador (cuentas nuevas).
 * content_os = biblioteca importada del fundador.
 */
export function normalizeProfile(profile: CreatorProfile): CreatorProfile {
  const mode = resolveWorkspaceMode(profile);
  return mode === "content_os"
    ? normalizeContentOs(profile)
    : normalizeBlank(profile);
}

/** Alias de normalizeProfile (compat). */
export function withUser1Defaults(profile: CreatorProfile): CreatorProfile {
  return normalizeProfile(profile);
}

export function profileContext(profile: CreatorProfile): string {
  return profileContextFor(profile);
}

/** Contexto IA; si la idea trae gameId, prioriza esa ficha. */
export function profileContextFor(
  profile: CreatorProfile,
  opts?: { gameId?: string; contentAngle?: string }
): string {
  let p = normalizeProfile(profile);
  if (opts?.gameId && p.gamesLibrary?.length) {
    const match = p.gamesLibrary.find((g) => g.id === opts.gameId);
    if (match) {
      p = {
        ...p,
        activeGameId: match.id,
        gameBrief: match,
      };
    }
  }

  const niches = p.niches.join(", ");
  const custom = p.customDescription.trim();
  const parts: string[] = [];

  if (p.brand) {
    const b = p.brand;
    const hasBrand = Boolean(
      b.creatorName.trim() ||
        b.community.trim() ||
        b.ctaSubscribe.trim() ||
        b.ctaDiscord.trim()
    );
    if (hasBrand) {
      parts.push("=== BRAND ===");
      if (b.creatorName.trim()) parts.push(`Creador: ${b.creatorName}`);
      if (b.community.trim()) parts.push(`Comunidad: ${b.community}`);
      if (b.kick.trim()) parts.push(`Kick: ${b.kick}`);
      if (b.streamSchedule.trim()) parts.push(`Lives: ${b.streamSchedule}`);
      if (b.sponsor.trim()) parts.push(`Sponsor: ${b.sponsor}`);
      if (b.ctaSubscribe.trim())
        parts.push(`CTA suscripción: ${b.ctaSubscribe}`);
      if (b.ctaDiscord.trim()) parts.push(`CTA Discord: ${b.ctaDiscord}`);
      if (b.ctaCrossPlatform.trim())
        parts.push(`CTA cross: ${b.ctaCrossPlatform}`);
    }
  }

  if (niches) parts.push(`\nNichos: ${niches}`);
  if (custom) parts.push(`Descripción del canal: ${custom}`);
  if (opts?.contentAngle) {
    parts.push(`Ángulo preferido de esta idea: ${opts.contentAngle}`);
  }

  if (hasGamingNiche(p) && p.useGameContext !== false && p.gameBrief) {
    const g = p.gameBrief;
    parts.push("");
    parts.push("=== CONTEXTO DEL JUEGO ACTIVO ===");
    parts.push(`Juego: ${g.name}`);
    parts.push(`Qué es: ${g.whatItIs}`);
    parts.push(`Loop típico del video: ${g.loop}`);
    if (g.terms.length) {
      parts.push(`Términos / vocabulario: ${g.terms.join("; ")}`);
    }
    if (g.doNotInvent.length) {
      parts.push(`Reglas (obligatorias):\n- ${g.doNotInvent.join("\n- ")}`);
    }
    if (g.latestUpdate.trim()) {
      parts.push(
        `UPDATE RECIENTE${
          g.latestUpdateAt ? ` (${g.latestUpdateAt})` : ""
        }:\n${g.latestUpdate.trim()}`
      );
      parts.push(
        "Si la idea habla del update o de lo nuevo, prioriza este update. No contradigas estos hechos."
      );
    } else {
      parts.push(
        "Update reciente: (vacío — no inventes patch notes; usa la ficha con cautela)."
      );
    }
    if (p.gamesLibrary && p.gamesLibrary.length > 1) {
      parts.push(
        `Otros juegos del canal: ${p.gamesLibrary
          .filter((x) => x.id !== g.id)
          .map((x) => x.name)
          .join("; ")}`
      );
    }
  }

  // Estilo de grabación: siempre (no depende de Gaming / useGameContext).
  if (p.recordingStyle) {
    const r = p.recordingStyle;
    const ytDesc = (r.youtubeDescriptionStyle ?? "").trim();
    const hasStyle = Boolean(
      r.howIRecord.trim() ||
        r.voiceAndPacing.trim() ||
        ytDesc ||
        r.typicalShots.length ||
        r.avoid.length
    );
    if (hasStyle) {
      parts.push("");
      parts.push("=== ASÍ SUENA TU CONTENIDO (obligatorio) ===");
      parts.push(
        "La IA usa esto al escribir guiones y descripciones. Si pide saludo, intro o cierre fijo, inclúyelo."
      );
      if (r.howIRecord.trim()) {
        parts.push(
          `Cómo grabo (formato / estructura del video): ${r.howIRecord}`
        );
      }
      if (r.videoTypes.length)
        parts.push(`Tipos / ángulos: ${r.videoTypes.join(", ")}`);
      if (r.voiceAndPacing.trim()) {
        parts.push(
          `Voz y ritmo (tono al escribir el guion, imita cómo habla el creador): ${r.voiceAndPacing}`
        );
      }
      if (ytDesc) {
        parts.push(
          `Descripciones de YouTube (formato al generar paquete de subida): ${ytDesc}`
        );
      }
      if (r.typicalShots.length) {
        parts.push(`Tomas típicas:\n- ${r.typicalShots.join("\n- ")}`);
      }
      if (r.avoid.length) {
        parts.push(`Evitar:\n- ${r.avoid.join("\n- ")}`);
      }
    }
  }

  if (p.provenHooks?.length) {
    parts.push("");
    parts.push(
      "=== HOOKS PROBADOS (inspiración de tono, no copies literal siempre) ==="
    );
    parts.push(p.provenHooks.map((h) => `- ${h}`).join("\n"));
  }

  return parts.join("\n");
}
