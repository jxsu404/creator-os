export type IdeaStatus = "captured" | "in_progress" | "ready" | "archived";

export type DraftFormat = "script" | "beats" | "both";

export interface CreatorProfile {
  niches: string[];
  customDescription: string;
  onboardedAt: string;
}

export interface Direction {
  id: string;
  name: string;
  promise: string;
  angle: string;
  hook: string;
  why: string;
}

export interface Beat {
  say: string;
  show: string;
  notes?: string;
}

export interface Draft {
  format: DraftFormat;
  hook: string;
  scriptBody: string;
  closing: string;
  beats: Beat[];
  estimatedSeconds: number;
  updatedAt: string;
}

export interface Idea {
  id: string;
  rawText: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  directions?: Direction[];
  selectedDirectionId?: string;
  directionAdjustment?: string;
  draft?: Draft;
}

export const NICHE_CHIPS = [
  "Gaming",
  "Roblox",
  "Guías",
  "Showcases",
  "Opiniones",
  "Vlogs",
  "Fitness",
  "Cocina",
  "Finanzas",
  "Educación",
  "Tech",
  "Comedia",
  "Lifestyle",
  "Belleza",
  "Negocios",
] as const;

export const STATUS_LABEL: Record<IdeaStatus, string> = {
  captured: "Capturada",
  in_progress: "En curso",
  ready: "Lista para grabar",
  archived: "Archivada",
};
