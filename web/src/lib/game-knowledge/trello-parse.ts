import {
  AFS_GAME_ID,
  AFS_SKIP_LISTS,
  AFS_TRELLO_BOARD_ID,
  AFS_TRELLO_BOARD_URL,
  type GameKnowledgePack,
  type KnowledgeChunk,
} from "./types";

type TrelloList = { id: string; name: string; closed?: boolean };
type TrelloCard = {
  id: string;
  name: string;
  desc?: string;
  idList: string;
  closed?: boolean;
  pos?: number;
};

export type TrelloBoardJson = {
  id?: string;
  name?: string;
  lists?: TrelloList[];
  cards?: TrelloCard[];
};

function normalizeHaystack(title: string, list: string, body: string): string {
  return `${list}\n${title}\n${body}`.toLowerCase();
}

function slugPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * Parte cuerpos largos por headings markdown para chunks más recuperables.
 */
export function splitLongBody(
  title: string,
  body: string,
  maxLen = 2800
): { title: string; body: string }[] {
  const trimmed = body.trim();
  if (!trimmed) return [{ title, body: "" }];
  if (trimmed.length <= maxLen) return [{ title, body: trimmed }];

  const parts = trimmed.split(/\n(?=#{1,3}\s)/);
  if (parts.length <= 1) {
    const out: { title: string; body: string }[] = [];
    for (let i = 0; i < trimmed.length; i += maxLen) {
      const slice = trimmed.slice(i, i + maxLen).trim();
      if (!slice) continue;
      out.push({
        title: out.length === 0 ? title : `${title} (${out.length + 1})`,
        body: slice,
      });
    }
    return out.length ? out : [{ title, body: trimmed }];
  }

  const out: { title: string; body: string }[] = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    const heading = text.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
    const sectionTitle = heading ? `${title} — ${heading}` : title;
    if (text.length <= maxLen) {
      out.push({ title: sectionTitle, body: text });
      continue;
    }
    for (let i = 0; i < text.length; i += maxLen) {
      const slice = text.slice(i, i + maxLen).trim();
      if (!slice) continue;
      out.push({
        title:
          i === 0 ? sectionTitle : `${sectionTitle} (${Math.floor(i / maxLen) + 1})`,
        body: slice,
      });
    }
  }
  return out.length ? out : [{ title, body: trimmed }];
}

/** Convierte el JSON público de un board Trello en pack buscable. */
export function parseTrelloBoardToPack(
  board: TrelloBoardJson,
  opts?: { syncedAt?: string; boardUrl?: string; gameId?: string }
): GameKnowledgePack {
  const lists = (board.lists || []).filter((l) => !l.closed);
  const listById = new Map(lists.map((l) => [l.id, l]));
  const cards = (board.cards || [])
    .filter((c) => !c.closed)
    .slice()
    .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));

  const chunks: KnowledgeChunk[] = [];
  const listNames: string[] = [];
  const seenLists = new Set<string>();

  for (const card of cards) {
    const list = listById.get(card.idList);
    if (!list) continue;
    const listName = list.name.trim();
    if (AFS_SKIP_LISTS.has(listName.toLowerCase())) continue;

    if (!seenLists.has(listName)) {
      seenLists.add(listName);
      listNames.push(listName);
    }

    const title = (card.name || "").trim() || "(sin título)";
    const rawBody = (card.desc || "").trim();
    // Tarjetas solo-título en Update Log a veces son placeholders vacíos
    if (!rawBody && title.length < 3) continue;

    const sections = splitLongBody(title, rawBody);
    sections.forEach((section, index) => {
      const id = `${card.id}${sections.length > 1 ? `-${index}` : ""}`;
      chunks.push({
        id,
        list: listName,
        title: section.title,
        body: section.body,
        haystack: normalizeHaystack(section.title, listName, section.body),
      });
    });
  }

  return {
    gameId: opts?.gameId || AFS_GAME_ID,
    source: "trello",
    boardId: board.id || AFS_TRELLO_BOARD_ID,
    boardName: board.name || "AFS Official Trello",
    boardUrl: opts?.boardUrl || AFS_TRELLO_BOARD_URL,
    syncedAt: opts?.syncedAt || new Date().toISOString(),
    lists: listNames,
    chunks,
  };
}

export function chunkPreview(body: string, max = 140): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function chunkSlug(list: string, title: string): string {
  return `${slugPart(list)}--${slugPart(title)}`;
}
