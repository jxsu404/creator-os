export type IdeaStatus =
  | "captured"
  | "in_progress"
  | "ready"
  | "recorded"
  | "archived";

/** "guide" es el único formato de v1; script/beats/both quedan por ideas legacy en localStorage */
export type DraftFormat = "guide" | "script" | "beats" | "both";

/** Ángulos de contenido (guía, update, ranking, etc.) */
export type ContentAngle =
  | "Guide"
  | "Update"
  | "Ranking"
  | "Errors"
  | "Tutorial"
  | "Collab"
  | "Event"
  | "Opinion"
  | "Promo"
  | "Codes";

/** Ficha de juego del canal (biblioteca multi-juego) */
export interface GameBrief {
  id: string;
  name: string;
  whatItIs: string;
  loop: string;
  terms: string[];
  doNotInvent: string[];
  /** Pegado desde Discord / anuncios — lo más reciente del juego */
  latestUpdate: string;
  latestUpdateAt?: string;
}

/** Cómo graba este creador (estilo reutilizable en prompts) */
export interface RecordingStyle {
  /** Formatos de video: gameplay, facecam, shorts, etc. — estructura del guion. */
  howIRecord: string;
  typicalShots: string[];
  /** Tono y forma de escribir/hablar — la IA lo imita al convertir la idea en guion. */
  voiceAndPacing: string;
  /** Formato deseado para descripciones del paquete YouTube. */
  youtubeDescriptionStyle?: string;
  avoid: string[];
  videoTypes: string[];
}

export interface BrandKitStored {
  creatorName: string;
  community: string;
  kick: string;
  streamSchedule: string;
  sponsor: string;
  ctaSubscribe: string;
  ctaDiscord: string;
  ctaCrossPlatform: string;
}

export interface YoutubeConnection {
  channelId: string;
  channelTitle: string;
  channelHandle?: string;
  uploadsPlaylistId: string;
  connectedAt: string;
  subscriberCount?: number;
  videoCount?: number;
}

export interface YoutubeCachedVideo {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface YoutubeVideoCache {
  videos: YoutubeCachedVideo[];
  fetchedAt: string;
}

/** Nota de texto simple (guiones, apuntes) — solo local, sin IA. */
export interface TextNote {
  id: string;
  /** Opcional; si falta, la UI usa la primera línea del body. */
  title?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  /** Idea de origen si se guardó desde un guion. */
  sourceIdeaId?: string;
}

export interface CreatorProfile {
  niches: string[];
  customDescription: string;
  onboardedAt: string;
  /** Última edición local/cloud del perfil (last-write-wins en sync). */
  updatedAt?: string;
  /**
   * blank = canal propio (nuevos usuarios).
   * content_os = perfil con biblioteca importada del fundador.
   */
  workspaceMode?: "blank" | "content_os";
  /** Si true (y nicho Gaming), se inyecta ficha de juego en la IA */
  useGameContext?: boolean;
  /** Juego activo para prompts (id de SEED_GAMES / gameBrief) */
  activeGameId?: string;
  gameBrief?: GameBrief;
  /** Biblioteca multi-juego del canal */
  gamesLibrary?: GameBrief[];
  recordingStyle?: RecordingStyle;
  brand?: BrandKitStored;
  provenHooks?: string[];
  youtube?: YoutubeConnection | null;
  youtubeCache?: YoutubeVideoCache | null;
}

export interface Direction {
  id: string;
  name: string;
  promise: string;
  angle: string;
  hook: string;
  why: string;
}

export interface Beat {
  say: string;
  show: string;
  notes?: string;
}

/** Bloque temático de un guion YouTube largo (sin plan de cámara). */
export interface ScriptBlock {
  id: string;
  title: string;
  body: string;
}

/** short = TikTok/Shorts/Reels; long = YouTube 3–30 min. Legacy sin campo = short. */
export type VideoMode = "short" | "long";

/**
 * explore = idea vaga → 3 enfoques → guía (default / legacy).
 * direct = idea ya decidida → guía/guion sin elegir enfoques.
 */
export type IdeaFlow = "explore" | "direct";

export interface Draft {
  format: DraftFormat;
  hook: string;
  scriptBody: string;
  closing: string;
  /** Legacy: ya no se generan tomas; se guarda vacío */
  beats: Beat[];
  /** Bloques temáticos (solo modo YouTube largo) */
  blocks?: ScriptBlock[];
  /** Guion unificado editable por el creador (después de la vista previa de la IA) */
  creatorScript?: string;
  estimatedSeconds: number;
  updatedAt: string;
}

/** Metadatos listos para pegar en YouTube Studio / caption TikTok-Shorts. */
export interface YoutubeUploadPackage {
  title: string;
  description: string;
  tags: string[];
  /** Una sola línea: concepto visual de la miniatura (la imagen viene después). */
  thumbnailIdea: string;
  generatedAt: string;
  /** Nombre corto de la estrategia (cuando eligió entre 3 opciones). */
  label?: string;
}

export interface Idea {
  id: string;
  rawText: string;
  /** short = vertical corto; long = YouTube largo. Ausente = short (legacy). */
  videoMode?: VideoMode;
  /** explore = 3 enfoques; direct = guion desde idea ya decidida. Ausente = explore. */
  ideaFlow?: IdeaFlow;
  /** Título corto generado con IA a partir de rawText (para listas) */
  title?: string;
  /**
   * Categoría visual de la idea (chip de nicho).
   * Define la miniatura predeterminada; `thumbnailUrl` la reemplaza si existe.
   */
  category?: string;
  /**
   * Miniatura propia (p. ej. generada con IA a petición del usuario).
   * Si está, tiene prioridad sobre la imagen de categoría.
   */
  thumbnailUrl?: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  directions?: Direction[];
  selectedDirectionId?: string;
  directionAdjustment?: string;
  draft?: Draft;
  /** Paquete para subir a YouTube (título, desc, tags, idea de miniatura) */
  youtubePackage?: YoutubeUploadPackage;
  /** Origen / nota libre (p. ej. importación) */
  gameId?: string;
  contentAngle?: ContentAngle;
  timing?: "Evergreen" | "Timely" | "Event Window";
  sourceNote?: string;
  notionKey?: string;
}

export const NICHE_CHIPS = [
  "Gaming",
  "Roblox",
  "Guías",
  "Showcases",
  "Opiniones",
  "Vlogs",
  "Fitness",
  "Cocina",
  "Finanzas",
  "Educación",
  "Tech",
  "Comedia",
  "Lifestyle",
  "Belleza",
  "Negocios",
] as const;

export const STATUS_LABEL: Record<IdeaStatus, string> = {
  captured: "Capturada",
  in_progress: "En curso",
  ready: "Lista para grabar",
  recorded: "Grabada",
  archived: "Archivada",
};
