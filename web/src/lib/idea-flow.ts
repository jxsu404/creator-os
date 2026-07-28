import type { Idea, IdeaFlow } from "./types";

export function resolveIdeaFlow(idea: Pick<Idea, "ideaFlow"> | IdeaFlow | undefined): IdeaFlow {
  if (idea === "direct" || idea === "explore") return idea;
  if (idea && typeof idea === "object" && idea.ideaFlow === "direct") {
    return "direct";
  }
  return "explore";
}

export function isDirectScriptFlow(idea: Pick<Idea, "ideaFlow">): boolean {
  return resolveIdeaFlow(idea) === "direct";
}
