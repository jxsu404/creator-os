import { AI_INPUT_CAPS, clampAiText } from "@/lib/ai-input";
import { profileContextFor, withUser1Defaults } from "@/lib/profile-context";
import { getProfile } from "@/lib/storage";
import type { CreatorProfile, Idea } from "@/lib/types";

export function ideaAiContextFromProfile(
  profile: CreatorProfile | null | undefined,
  idea: Pick<Idea, "gameId" | "contentAngle">
): string {
  if (!profile) return "";
  const raw = profileContextFor(withUser1Defaults(profile), {
    gameId: idea.gameId,
    contentAngle: idea.contentAngle,
  });
  return clampAiText(raw, AI_INPUT_CAPS.profileContext);
}

export function ideaAiContext(idea: Idea): string {
  return ideaAiContextFromProfile(getProfile(), idea);
}
