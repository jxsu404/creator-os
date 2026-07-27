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
  howIRecord: string;
  typicalShots: string[];
  voiceAndPacing: string;
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
  /** Si true, se inyecta ficha de juego + estilo de grabación en la IA */
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

export interface Draft {
  format: DraftFormat;
  hook: string;
  scriptBody: string;
  closing: string;
  /** Tomas sugeridas de cámara / plan de grabación */
  beats: Beat[];
  /** Guion unificado editable por el creador (después de la vista previa de la IA) */
  creatorScript?: string;
  estimatedSeconds: number;
  updatedAt: string;
}

/** Metadatos listos para pegar en YouTube Studio al subir. */
export interface YoutubeUploadPackage {
  title: string;
  description: string;
  tags: string[];
  /** Una sola línea: concepto visual de la miniatura (la imagen viene después). */
  thumbnailIdea: string;
  generatedAt: string;
}

export interface Idea {
  id: string;
  rawText: string;
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
