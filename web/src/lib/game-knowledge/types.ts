/** Pack de conocimiento de juego (Trello / fuentes oficiales). */

export type KnowledgeChunk = {
  id: string;
  list: string;
  title: string;
  body: string;
  /** Texto normalizado para búsqueda */
  haystack: string;
};

export type GameKnowledgePack = {
  gameId: string;
  source: "trello";
  boardId: string;
  boardName: string;
  boardUrl: string;
  syncedAt: string;
  lists: string[];
  chunks: KnowledgeChunk[];
};

export type KnowledgeChunkSummary = {
  id: string;
  list: string;
  title: string;
  preview: string;
};

export const AFS_GAME_ID = "anime-fighting-simulator";
export const AFS_TRELLO_BOARD_ID = "p0KzzKdm";
export const AFS_TRELLO_BOARD_URL =
  "https://trello.com/b/p0KzzKdm/afs-official-trello";
export const AFS_TRELLO_JSON_URL =
  "https://trello.com/b/p0KzzKdm/afs-official-trello.json";

/** Listas del board que no aportan al contenido creativo. */
export const AFS_SKIP_LISTS = new Set([
  "trello team",
  "information",
]);

/** Presupuesto de chars del pack inyectado en el contexto IA. */
export const KNOWLEDGE_CONTEXT_BUDGET = 1600;
