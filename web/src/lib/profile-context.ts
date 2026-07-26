import type { CreatorProfile } from "./types";

export function profileContext(profile: CreatorProfile): string {
  const niches = profile.niches.join(", ");
  const custom = profile.customDescription.trim();
  return [niches && `Nichos: ${niches}`, custom && `Descripción: ${custom}`]
    .filter(Boolean)
    .join("\n");
}
