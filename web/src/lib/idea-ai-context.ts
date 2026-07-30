import { AI_INPUT_CAPS, clampAiText } from "@/lib/ai-input";
import {
  AFS_GAME_ID,
  KNOWLEDGE_CONTEXT_BUDGET,
} from "@/lib/game-knowledge/types";
import { profileContextFor, withUser1Defaults } from "@/lib/profile-context";
import { getProfile } from "@/lib/storage";
import type { CreatorProfile, Idea } from "@/lib/types";

export function ideaAiContextFromProfile(
  profile: CreatorProfile | null | undefined,
  idea: Pick<Idea, "gameId" | "contentAngle">,
  opts?: { knowledgeBudget?: number }
): string {
  if (!profile) return "";
  const budget = opts?.knowledgeBudget ?? 0;
  const cap = Math.max(500, AI_INPUT_CAPS.profileContext - budget);
  const raw = profileContextFor(withUser1Defaults(profile), {
    gameId: idea.gameId,
    contentAngle: idea.contentAngle,
  });
  return clampAiText(raw, cap);
}

export function ideaAiContext(idea: Idea): string {
  return ideaAiContextFromProfile(getProfile(), idea);
}

function resolvesToAfs(
  profile: CreatorProfile,
  idea: Pick<Idea, "gameId">
): boolean {
  const p = withUser1Defaults(profile);
  const gameId =
    idea.gameId || p.activeGameId || p.gameBrief?.id || "";
  if (gameId === AFS_GAME_ID) return true;
  if (gameId) return false;
  // Sin gameId explícito: si el activo es AFS
  return (p.activeGameId || p.gameBrief?.id) === AFS_GAME_ID;
}

/**
 * Contexto de perfil + trozos del Trello AFS relevantes a la idea.
 * Falla suave: si el sync falla, devuelve solo el perfil.
 */
export async function ideaAiContextWithKnowledge(
  idea: Pick<Idea, "gameId" | "contentAngle" | "rawText">,
  profile: CreatorProfile | null | undefined = getProfile()
): Promise<string> {
  if (!profile) return "";

  const wantsKnowledge = resolvesToAfs(profile, idea);
  const base = ideaAiContextFromProfile(profile, idea, {
    knowledgeBudget: wantsKnowledge ? KNOWLEDGE_CONTEXT_BUDGET : 0,
  });

  if (!wantsKnowledge) {
    return clampAiText(base, AI_INPUT_CAPS.profileContext);
  }

  try {
    const params = new URLSearchParams({
      retrieve: "1",
      q: idea.rawText || "",
      maxChars: String(KNOWLEDGE_CONTEXT_BUDGET),
    });
    const res = await fetch(`/api/game-knowledge/afs?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return clampAiText(base, AI_INPUT_CAPS.profileContext);
    }
    const data = (await res.json()) as { context?: string };
    const knowledge = (data.context || "").trim();
    if (!knowledge) {
      return clampAiText(base, AI_INPUT_CAPS.profileContext);
    }
    return clampAiText(
      `${base}\n\n${knowledge}`,
      AI_INPUT_CAPS.profileContext
    );
  } catch {
    return clampAiText(base, AI_INPUT_CAPS.profileContext);
  }
}
