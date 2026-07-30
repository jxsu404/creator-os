import { clampAiText } from "@/lib/ai-input";
import type { GameKnowledgePack, KnowledgeChunk } from "./types";

const STOPWORDS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "el",
  "en",
  "la",
  "las",
  "lo",
  "los",
  "para",
  "por",
  "que",
  "se",
  "un",
  "una",
  "y",
  "the",
  "and",
  "of",
  "to",
  "in",
  "for",
  "how",
  "get",
  "afs",
  "anime",
  "fighting",
  "simulator",
  "roblox",
  "video",
  "guia",
  "guía",
]);

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function scoreChunk(chunk: KnowledgeChunk, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  let score = 0;
  const title = chunk.title.toLowerCase();
  const list = chunk.list.toLowerCase();
  for (const token of tokens) {
    if (title.includes(token)) score += 8;
    if (list.includes(token)) score += 3;
    if (chunk.haystack.includes(token)) score += 2;
  }
  return score;
}

export function searchKnowledgeChunks(
  pack: GameKnowledgePack,
  query: string,
  limit = 24
): KnowledgeChunk[] {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) {
    return pack.chunks.slice(0, limit);
  }
  return pack.chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, tokens) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.title.localeCompare(b.chunk.title))
    .slice(0, limit)
    .map((row) => row.chunk);
}

/** Formatea trozos relevantes para el prompt de la IA. */
export function formatKnowledgeForAi(
  chunks: KnowledgeChunk[],
  maxChars: number
): string {
  if (!chunks.length || maxChars <= 0) return "";
  const lines: string[] = [
    "",
    "=== CONOCIMIENTO AFS (Trello oficial, hechos verificados) ===",
    "Usa solo estos hechos. Si falta un dato, di [CONFIRMAR] — no inventes.",
  ];
  let used = lines.join("\n").length;

  for (const chunk of chunks) {
    const block = `\n[${chunk.list}] ${chunk.title}\n${chunk.body}`;
    if (used + block.length > maxChars) {
      const room = maxChars - used - 20;
      if (room < 80) break;
      lines.push(clampAiText(block, room));
      break;
    }
    lines.push(block);
    used += block.length;
  }

  return lines.join("\n").trimEnd();
}

export function retrieveKnowledgeContext(
  pack: GameKnowledgePack,
  query: string,
  maxChars: number
): string {
  const chunks = searchKnowledgeChunks(pack, query, 12);
  return formatKnowledgeForAi(chunks, maxChars);
}
