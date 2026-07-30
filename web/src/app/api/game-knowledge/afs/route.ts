import { NextResponse } from "next/server";
import { loadAfsKnowledgePack, peekAfsPack } from "@/lib/game-knowledge/afs-pack";
import {
  retrieveKnowledgeContext,
  searchKnowledgeChunks,
} from "@/lib/game-knowledge/retrieve";
import { chunkPreview } from "@/lib/game-knowledge/trello-parse";
import {
  KNOWLEDGE_CONTEXT_BUDGET,
} from "@/lib/game-knowledge/types";
import { aiRouteError } from "@/lib/ai-input";
import { unauthorizedApiResponse } from "@/lib/supabase/require-api-user";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function packMeta(pack: Awaited<ReturnType<typeof loadAfsKnowledgePack>>) {
  return {
    gameId: pack.gameId,
    source: pack.source,
    boardId: pack.boardId,
    boardName: pack.boardName,
    boardUrl: pack.boardUrl,
    syncedAt: pack.syncedAt,
    listCount: pack.lists.length,
    chunkCount: pack.chunks.length,
    lists: pack.lists.map((name) => ({
      name,
      count: pack.chunks.filter((c) => c.list === name).length,
    })),
  };
}

export async function GET(req: Request) {
  const denied = await unauthorizedApiResponse();
  if (denied) return denied;

  try {
    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh") === "1";
    const retrieve = url.searchParams.get("retrieve") === "1";
    const q = (url.searchParams.get("q") || "").trim();
    const id = (url.searchParams.get("id") || "").trim();
    const list = (url.searchParams.get("list") || "").trim();
    const limitRaw = Number(url.searchParams.get("limit") || "40");
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
      : 40;
    const maxCharsRaw = Number(
      url.searchParams.get("maxChars") || String(KNOWLEDGE_CONTEXT_BUDGET)
    );
    const maxChars = Number.isFinite(maxCharsRaw)
      ? Math.max(200, Math.min(4000, Math.floor(maxCharsRaw)))
      : KNOWLEDGE_CONTEXT_BUDGET;

    const pack = await loadAfsKnowledgePack({ force: refresh });

    if (retrieve) {
      const context = retrieveKnowledgeContext(pack, q, maxChars);
      return NextResponse.json({
        ...packMeta(pack),
        query: q,
        context,
        contextChars: context.length,
      });
    }

    if (id) {
      const chunk = pack.chunks.find((c) => c.id === id);
      if (!chunk) {
        return NextResponse.json(
          { error: "No encontré esa entrada." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        ...packMeta(pack),
        chunk: {
          id: chunk.id,
          list: chunk.list,
          title: chunk.title,
          body: chunk.body,
        },
      });
    }

    let chunks = pack.chunks;
    if (list) {
      chunks = chunks.filter(
        (c) => c.list.toLowerCase() === list.toLowerCase()
      );
    }
    if (q) {
      chunks = searchKnowledgeChunks(
        { ...pack, chunks },
        q,
        limit
      );
    } else {
      chunks = chunks.slice(0, limit);
    }

    return NextResponse.json({
      ...packMeta(pack),
      query: q || undefined,
      list: list || undefined,
      items: chunks.map((c) => ({
        id: c.id,
        list: c.list,
        title: c.title,
        preview: chunkPreview(c.body || c.title),
      })),
    });
  } catch (err) {
    return aiRouteError(
      "game-knowledge/afs",
      err,
      "No pude sincronizar el Trello de AFS. Intenta de nuevo."
    );
  }
}

/** Fuerza re-sync del board oficial. */
export async function POST() {
  const denied = await unauthorizedApiResponse();
  if (denied) return denied;

  try {
    const pack = await loadAfsKnowledgePack({ force: true });
    return NextResponse.json({
      ok: true,
      ...packMeta(pack),
      cached: Boolean(peekAfsPack()),
    });
  } catch (err) {
    return aiRouteError(
      "game-knowledge/afs",
      err,
      "No pude actualizar el Trello de AFS."
    );
  }
}
