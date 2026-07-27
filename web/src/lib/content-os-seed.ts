/**
 * Snapshot migrado desde Notion Content OS (Josué Valles / Crimson Core).
 * Fuente: https://app.notion.com/p/3a486f5337a681d0b2bfe2b7c657abbf
 * Fecha de extracción: 2026-07-26
 *
 * Creator OS NO clona el pipeline long-form de Notion.
 * Aquí entra: brand, juegos, CTAs, hooks probados, ideas activas y memoria de piezas.
 */

import type { ContentAngle, GameBrief, Idea, IdeaStatus } from "./types";

export const CONTENT_OS_IMPORT_VERSION = 2;
export const CONTENT_OS_IMPORT_KEY = "creatoros_content_os_import_v1";

export interface BrandKit {
  creatorName: string;
  community: string;
  kick: string;
  audienceLanguage: string;
  platforms: string[];
  streamSchedule: string;
  sponsor: string;
  ctas: {
    subscribe: string;
    discord: string;
    crossPlatform: string;
  };
}

export interface SeedGame {
  id: string;
  brief: GameBrief;
  priority: "Primary" | "Secondary" | "Experimental";
  status: "Active" | "Upcoming" | "Paused";
  discordCta?: string;
  notes?: string;
}

export interface SeedIdeaRow {
  notionKey: string;
  rawText: string;
  status: IdeaStatus;
  gameId: string;
  angle?: ContentAngle;
  timing?: "Evergreen" | "Timely" | "Event Window";
  why?: string;
  source?: string;
}

export const BRAND_KIT: BrandKit = {
  creatorName: "Josué Valles",
  community: "Crimson Core",
  kick: "josuhere1",
  audienceLanguage: "Spanish",
  platforms: ["YouTube", "YouTube Shorts", "TikTok", "Discord", "Kick"],
  streamSchedule:
    "Lun–Vie live en TikTok. Sáb–Dom live en Kick (josuhere1). Shorts/TikTok promueven lives de semana; finde empuja Kick.",
  sponsor: "UGPhone (divulgar siempre si hay collab pagada)",
  ctas: {
    subscribe:
      "Si te sirvió, dale like y suscríbete para no perderte las guías.",
    discord:
      "Únete a Crimson Core. Link en la descripción — farmeamos bosses, dungeons y actualizaciones juntos.",
    crossPlatform:
      "Sígueme en TikTok para clips rápidos. Link en la descripción.",
  },
};

/** Hooks probados / de Content OS (para tono de la IA) */
export const PROVEN_HOOKS: string[] = [
  "¿Siempre intentas hacer a Kurama tú solo… y terminas muriendo una y otra vez?",
  "¡La tercera actualización de Anime Fighting Simulator ya llegó y trae muchísimo contenido!",
  "¿Sabías que estás perdiendo miles de horas de farm solo por usar el campeón equivocado?",
  "Descubrí cómo farmear en Anime Fighting Simulator sin dejar mi PC prendida todo el día… Y no… no estoy usando hacks ni nada raro.",
  "Quieres hacer miles y miles de daño en la nueva Torre de Anime Fighting Simulator…",
  "El Susanoo Perfecto es el #1 ahora mismo…",
  "¿Rika o Infinito? Están MUY igualados en el meta…",
];

export const SEED_GAMES: SeedGame[] = [
  {
    id: "anime-fighting-simulator",
    priority: "Primary",
    status: "Active",
    discordCta: "Únete a Crimson Core — link en la descripción",
    notes: "Nicho primario. Audiencia Roblox AFS en español.",
    brief: {
      id: "anime-fighting-simulator",
      name: "Anime Fighting Simulator (Roblox / BlockZone)",
      whatItIs:
        "Juego de Roblox tipo anime fighting / training sim (BlockZone): entrenas stats, desbloqueas poderes/clases/frutas, pelear, farmear (Torre, raids, bosses) y progresar. Público: jugadores activos o que quieren mejorar / enterarse del update. Comunidad del creador: Crimson Core.",
      loop: "Hook de dolor/meta → valor concreto (guía, ranking, update, error) → prueba en gameplay → CTA Crimson Core + suscripción.",
      terms: [
        "stats / training / farm",
        "poderes especiales / frutas / traits / campeones",
        "Susanoo Perfecto / Maldición de Rika / Infinito / Magma",
        "raid Madara / isla Naruto / Torre",
        "update / admin abuse / codes",
        "Crimson Core (Discord)",
      ],
      doNotInvent: [
        "No inventes números exactos de stats, drop rates o códigos si no están en el update pegado.",
        "No inventes fechas de update ni nombres de poderes si no están en el contexto.",
        "Meta reciente conocida (jul 2026, verificar in-game): Susanoo Perfecto #1 (raid Madara → materiales → NPC Madara, permanente); Rika e Infinito muy igualados; Magma fuerte en AoE; Light fruit y Sun Blade nerfeadas.",
        "Si falta dato concreto, usa lenguaje orientativo o [CONFIRMAR].",
      ],
      latestUpdate:
        "Sneak peek Attack on Titan (devs, ~22 jul 2026) — video publicado. Meta poderes: Susanoo Perfecto #1; build rota ejemplo: Susanoo + Rika + Magma (+ Vasto/Authority). Rumbling / Admin Abuse en calendario de eventos AFS.",
      latestUpdateAt: "2026-07-26",
    },
  },
  {
    id: "shindo-life",
    priority: "Secondary",
    status: "Active",
    discordCta: "Únete a Crimson Core — link en la descripción",
    notes:
      "Naruto-inspired Roblox MMORPG (RELL World). Primera vez de Josué. Discurso soft revival jul 2026 — no afirmar update gigante sin confirmar. Bloodlines/spins, modes, grind, PvP, War Mode.",
    brief: {
      id: "shindo-life",
      name: "Shindo Life (Roblox / RELL World)",
      whatItIs:
        "MMORPG Roblox inspirado en Naruto (ex Shinobi Life 2). Peak ~2020–22. En jul 2026 hay discurso de soft revival. Josué lo cubre en primera persona (primera vez). Distinct de RELL Seas.",
      loop: "Primera vez / noob authenticity → descubrir sistemas → CTA live TikTok (semana) o Kick finde.",
      terms: [
        "bloodlines / spins",
        "modes / grind / PvP / War Mode",
        "dead game / revival (con cuidado)",
      ],
      doNotInvent: [
        "No afirmes un update masivo de Shindo si no está confirmado.",
        "No confundas con RELL Seas ni con AFS.",
      ],
      latestUpdate: "",
      latestUpdateAt: "",
    },
  },
  {
    id: "blox-lock",
    priority: "Secondary",
    status: "Upcoming",
    notes: "Juego Roblox upcoming — first-mover cobertura ES.",
    brief: {
      id: "blox-lock",
      name: "Blox Lock (Roblox — upcoming)",
      whatItIs:
        "Juego Roblox próximo a cubrir. Prioridad: ser de los primeros en español cuando lance.",
      loop: "First look / guía day-one → Shorts derivados.",
      terms: ["launch", "first look", "day one"],
      doNotInvent: [
        "No inventes mecánicas de Blox Lock hasta tener fuentes in-game / oficiales.",
      ],
      latestUpdate: "",
      latestUpdateAt: "",
    },
  },
  {
    id: "roblox-general",
    priority: "Secondary",
    status: "Active",
    notes: "Robux, tips de plataforma, tutoriales cross-game.",
    brief: {
      id: "roblox-general",
      name: "Roblox (general / plataforma)",
      whatItIs:
        "Contenido cross-game de Roblox: Robux legales, tips de plataforma, tutoriales que no son de un solo título.",
      loop: "Problema de plataforma → método seguro → CTA.",
      terms: ["Robux", "cuenta segura", "plataforma"],
      doNotInvent: [
        "Nunca promociones métodos ilegales o inseguros de Robux.",
      ],
      latestUpdate: "",
      latestUpdateAt: "",
    },
  },
];

/**
 * Solo ideas activas (no historial publicado) — menos ruido en Home.
 * Brand/juegos/hooks siguen en defaults aunque no se listen aquí.
 */
export const SEED_IDEAS: SeedIdeaRow[] = [
  {
    notionKey: "idea-shindo-tiktok",
    rawText:
      "TikTok + YT Short: Primera vez Shindo Life + dead game reviving → CTA live TikTok.",
    status: "captured",
    gameId: "shindo-life",
    angle: "Promo",
    timing: "Timely",
    source: "Content OS",
  },
  {
    notionKey: "idea-afs-beginners",
    rawText:
      "Guía principiantes AFS desde cero. Working title: La mejor forma de empezar AFS desde cero.",
    status: "captured",
    gameId: "anime-fighting-simulator",
    angle: "Guide",
    timing: "Evergreen",
    source: "Content OS",
  },
  {
    notionKey: "idea-errores-afs",
    rawText:
      "10 errores que te hacen perder horas en AFS. Hook: Si acabas de empezar AFS, probablemente vas a cometer alguno de estos errores…",
    status: "captured",
    gameId: "anime-fighting-simulator",
    angle: "Errors",
    timing: "Evergreen",
    source: "Content OS",
  },
  {
    notionKey: "idea-vale-pena-2026",
    rawText: "¿Vale la pena jugar Anime Fighting Simulator en 2026?",
    status: "captured",
    gameId: "anime-fighting-simulator",
    angle: "Opinion",
    timing: "Timely",
    source: "Content OS",
  },
  {
    notionKey: "idea-admin-abuse-3",
    rawText: "Admin Abuse Update 3 — event recap.",
    status: "captured",
    gameId: "anime-fighting-simulator",
    angle: "Event",
    timing: "Event Window",
    source: "Content OS",
  },
  {
    notionKey: "short-susanoo",
    rawText: "Short: El Susanoo Perfecto es el #1 ahora mismo…",
    status: "captured",
    gameId: "anime-fighting-simulator",
    angle: "Ranking",
    timing: "Timely",
    source: "Content OS",
  },
];

export function buildSeedIdeas(now = new Date().toISOString()): Idea[] {
  return SEED_IDEAS.map((row, index) => {
    const created = new Date(Date.now() - index * 60_000).toISOString();
    return {
      id: `cos-${row.notionKey}`,
      rawText: row.rawText,
      status: row.status,
      createdAt: created,
      updatedAt: now,
      gameId: row.gameId,
      contentAngle: row.angle,
      timing: row.timing,
      sourceNote: [row.source, row.why].filter(Boolean).join(" · "),
      notionKey: row.notionKey,
    };
  });
}

export const SHORT_VOICE_RULES = [
  "Idioma creativo: español. Estructura interna puede pensarse en inglés, salida siempre ES.",
  "Habla a new + mid players; veterans aún reciben matiz.",
  "Números concretos > “está roto” vago — pero verifica in-game; si no está en contexto, [CONFIRMAR].",
  "Guion short = líneas habladas + tomas [VISUAL]. Sin intros largas.",
  "CTA cuando encaje: suscripción + Crimson Core (Discord).",
  "Ángulos de Content OS: Guide, Update, Ranking, Errors, Tutorial, Collab, Event, Opinion, Promo, Codes.",
  "Shorts ≤45–60s. No uses densidad de long-form (1200+ palabras) en este producto.",
];
