import type { CreatorProfile, Idea } from "./types";

const PROFILE_KEY = "creatoros_profile_v1";
const IDEAS_KEY = "creatoros_ideas_v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getProfile(): CreatorProfile | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreatorProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CreatorProfile): void {
  if (!canUseStorage()) return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getIdeas(): Idea[] {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(IDEAS_KEY);
  if (!raw) return [];
  try {
    const ideas = JSON.parse(raw) as Idea[];
    return ideas.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveIdeas(ideas: Idea[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
}

export function getIdea(id: string): Idea | null {
  return getIdeas().find((i) => i.id === id) ?? null;
}

export function upsertIdea(idea: Idea): void {
  const ideas = getIdeas();
  const idx = ideas.findIndex((i) => i.id === idea.id);
  if (idx >= 0) ideas[idx] = idea;
  else ideas.unshift(idea);
  saveIdeas(ideas);
}

export function deleteIdea(id: string): void {
  saveIdeas(getIdeas().filter((i) => i.id !== id));
}
