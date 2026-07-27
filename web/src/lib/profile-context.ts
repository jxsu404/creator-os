import type { CreatorProfile, GameBrief } from "./types";
import { PROVEN_HOOKS } from "./content-os-seed";
import {
  DEFAULT_BRAND,
  DEFAULT_GAME_BRIEF,
  DEFAULT_GAMES_LIBRARY,
  DEFAULT_RECORDING_STYLE,
} from "./user1-defaults";

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

/** Rellena defaults User1 / Content OS sin pisar ediciones del creador. */
export function withUser1Defaults(profile: CreatorProfile): CreatorProfile {
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

  return {
    ...profile,
    useGameContext: profile.useGameContext !== false,
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
    niches:
      (profile.niches?.length ?? 0) > 0
        ? profile.niches
        : ["Gaming", "Roblox", "Guías", "Showcases", "Opiniones"],
    customDescription:
      (profile.customDescription ?? "").trim() ||
      "Roblox en español — Anime Fighting Simulator (primario), Shindo Life, Blox Lock upcoming. Comunidad Crimson Core. YouTube + Shorts + TikTok + Kick.",
  };
}

export function profileContext(profile: CreatorProfile): string {
  return profileContextFor(profile);
}

/** Contexto IA; si la idea trae gameId, prioriza esa ficha. */
export function profileContextFor(
  profile: CreatorProfile,
  opts?: { gameId?: string; contentAngle?: string }
): string {
  let p = withUser1Defaults(profile);
  if (opts?.gameId && p.gamesLibrary) {
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
    parts.push("=== BRAND (Content OS) ===");
    parts.push(`Creador: ${p.brand.creatorName}`);
    parts.push(`Comunidad: ${p.brand.community}`);
    parts.push(`Kick: ${p.brand.kick}`);
    parts.push(`Lives: ${p.brand.streamSchedule}`);
    if (p.brand.sponsor) parts.push(`Sponsor actual: ${p.brand.sponsor}`);
    parts.push(`CTA suscripción: ${p.brand.ctaSubscribe}`);
    parts.push(`CTA Discord: ${p.brand.ctaDiscord}`);
    parts.push(`CTA cross: ${p.brand.ctaCrossPlatform}`);
  }

  if (niches) parts.push(`\nNichos: ${niches}`);
  if (custom) parts.push(`Descripción del canal: ${custom}`);
  if (opts?.contentAngle) {
    parts.push(`Ángulo preferido de esta idea: ${opts.contentAngle}`);
  }

  if (p.useGameContext !== false && p.gameBrief) {
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

  if (p.useGameContext !== false && p.recordingStyle) {
    const r = p.recordingStyle;
    parts.push("");
    parts.push("=== CÓMO GRABA ESTE CREADOR ===");
    parts.push(`Formato: ${r.howIRecord}`);
    parts.push(`Tipos / ángulos: ${r.videoTypes.join(", ")}`);
    parts.push(`Voz y ritmo: ${r.voiceAndPacing}`);
    if (r.typicalShots.length) {
      parts.push(`Tomas típicas:\n- ${r.typicalShots.join("\n- ")}`);
    }
    if (r.avoid.length) {
      parts.push(`Evitar:\n- ${r.avoid.join("\n- ")}`);
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
