import { profileContextFor, withUser1Defaults } from "@/lib/profile-context";
import { getProfile } from "@/lib/storage";
import type { CreatorProfile, Idea } from "@/lib/types";

export function ideaAiContextFromProfile(
  profile: CreatorProfile | null | undefined,
  idea: Pick<Idea, "gameId" | "contentAngle">
): string {
  if (!profile) return "";
  return profileContextFor(withUser1Defaults(profile), {
    gameId: idea.gameId,
    contentAngle: idea.contentAngle,
  });
}

export function ideaAiContext(idea: Idea): string {
  return ideaAiContextFromProfile(getProfile(), idea);
}
