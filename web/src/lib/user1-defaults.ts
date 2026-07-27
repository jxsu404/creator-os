import type { GameBrief, RecordingStyle } from "./types";
import { BRAND_KIT, SEED_GAMES, SHORT_VOICE_RULES } from "./content-os-seed";

/**
 * Defaults Usuario 1 — alineados a Content OS (Notion).
 */
export const DEFAULT_GAME_BRIEF: GameBrief =
  SEED_GAMES.find((g) => g.id === "anime-fighting-simulator")!.brief;

export const DEFAULT_GAMES_LIBRARY: GameBrief[] = SEED_GAMES.map((g) => g.brief);

export const DEFAULT_RECORDING_STYLE: RecordingStyle = {
  howIRecord:
    "Josué Valles / Crimson Core. Gameplay Roblox en pantalla + voz en off. Short-form vertical (TikTok + YouTube Shorts) es el loop de Creator OS; long-form vive en Notion Content OS. Ritmo ágil: gancho en los primeros segundos, una idea clara, CTA Crimson Core cuando encaje.",
  typicalShots: [
    "Hook visual fuerte (combate, poder nuevo, fail→win, UI del update, Torre)",
    "Gameplay mientras explico (ruta spawn → isla, raid, menú)",
    "Insertos de inventario / stats / NPC de canje",
    "Clip de resultado (unlock, kill, before/after, tier moment)",
    "Cierre con CTA verbal + loop visual si encaja",
  ],
  voiceAndPacing: [
    "Tono cercano gamer hispano: directo, claro, sin anuncio.",
    "Guías = pasos concretos. Rankings = criterio + #1 + cómo conseguirlo.",
    "Updates = qué conseguir primero. Errors = problema → consecuencia → fix.",
    ...SHORT_VOICE_RULES,
  ].join(" "),
  avoid: [
    "No asumir facecam salvo que la idea lo pida.",
    "No guiones long-form (1200+ palabras) en este producto — eso es Notion.",
    "No intros largas (“hola chicos bienvenidos…”).",
    "No editar en CapCut como parte del guion; solo qué decir y qué mostrar.",
    "No omitir CTA Crimson Core si el ángulo es comunidad / farm en grupo.",
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
