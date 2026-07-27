import type { GameBrief, RecordingStyle } from "./types";
import { BRAND_KIT, SEED_GAMES, SHORT_VOICE_RULES } from "./content-os-seed";

/**
 * Defaults del perfil fundador (modo content_os / importación).
 */
export const DEFAULT_GAME_BRIEF: GameBrief =
  SEED_GAMES.find((g) => g.id === "anime-fighting-simulator")!.brief;

export const DEFAULT_GAMES_LIBRARY: GameBrief[] = SEED_GAMES.map((g) => g.brief);

export const DEFAULT_RECORDING_STYLE: RecordingStyle = {
  howIRecord:
    "Josué Valles / Crimson Core. Gameplay de Roblox en pantalla con voz en off. Videos verticales cortos (TikTok y YouTube Shorts). Ritmo ágil: gancho al inicio, una idea clara, y mención a Crimson Core cuando encaje.",
  typicalShots: [
    "Apertura visual fuerte (combate, poder nuevo, fail→win, menú del update, Torre)",
    "Gameplay mientras explico (ruta spawn → isla, raid, menú)",
    "Insertos de inventario / stats / NPC de canje",
    "Clip del resultado (unlock, kill, before/after)",
    "Cierre hablando a cámara o con loop visual si encaja",
  ],
  voiceAndPacing: [
    "Tono cercano gamer hispano: directo, claro, sin anuncio.",
    "Guías = pasos concretos. Rankings = criterio + #1 + cómo conseguirlo.",
    "Updates = qué conseguir primero. Errors = problema → consecuencia → solución.",
    ...SHORT_VOICE_RULES,
  ].join(" "),
  avoid: [
    "No asumir cámara al frente salvo que la idea lo pida.",
    "No guiones de video largo (1200+ palabras) en este producto.",
    "No intros largas (“hola chicos bienvenidos…”).",
    "No meter edición de CapCut en el guion; solo qué decir y qué mostrar.",
    "No omitir Crimson Core si el ángulo es comunidad o farm en grupo.",
  ],
  videoTypes: [
    "Guide",
    "Update",
    "Ranking",
    "Errors",
    "Tutorial",
    "Opinion",
    "Event",
    "Codes",
    "Promo / CTA Discord",
  ],
};

export const DEFAULT_BRAND = {
  creatorName: BRAND_KIT.creatorName,
  community: BRAND_KIT.community,
  kick: BRAND_KIT.kick,
  streamSchedule: BRAND_KIT.streamSchedule,
  sponsor: BRAND_KIT.sponsor,
  ctaSubscribe: BRAND_KIT.ctas.subscribe,
  ctaDiscord: BRAND_KIT.ctas.discord,
  ctaCrossPlatform: BRAND_KIT.ctas.crossPlatform,
};
