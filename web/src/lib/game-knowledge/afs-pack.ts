import {
  AFS_GAME_ID,
  AFS_TRELLO_BOARD_ID,
  AFS_TRELLO_BOARD_URL,
  AFS_TRELLO_JSON_URL,
  type GameKnowledgePack,
} from "./types";
import { parseTrelloBoardToPack, type TrelloBoardJson } from "./trello-parse";

const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheEntry = {
  pack: GameKnowledgePack;
  fetchedAt: number;
};

let cache: CacheEntry | null = null;
let inflight: Promise<GameKnowledgePack> | null = null;

export function getCachedAfsPack(): GameKnowledgePack | null {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
  return cache.pack;
}

export function peekAfsPack(): GameKnowledgePack | null {
  return cache?.pack ?? null;
}

async function fetchTrelloBoardJson(): Promise<TrelloBoardJson> {
  const res = await fetch(AFS_TRELLO_JSON_URL, {
    headers: { Accept: "application/json" },
    // Live sync: no Next static cache
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`No se pudo leer el Trello de AFS (${res.status}).`);
  }
  const data = (await res.json()) as TrelloBoardJson;
  if (!Array.isArray(data.cards) || !Array.isArray(data.lists)) {
    throw new Error("El JSON del Trello no trae lists/cards.");
  }
  return data;
}

export async function loadAfsKnowledgePack(
  opts?: { force?: boolean }
): Promise<GameKnowledgePack> {
  if (!opts?.force) {
    const hit = getCachedAfsPack();
    if (hit) return hit;
  }
  if (inflight && !opts?.force) return inflight;

  inflight = (async () => {
    const board = await fetchTrelloBoardJson();
    const pack = parseTrelloBoardToPack(board, {
      gameId: AFS_GAME_ID,
      boardUrl: AFS_TRELLO_BOARD_URL,
      syncedAt: new Date().toISOString(),
    });
    // Garantiza boardId corto conocido
    pack.boardId = AFS_TRELLO_BOARD_ID;
    cache = { pack, fetchedAt: Date.now() };
    return pack;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
