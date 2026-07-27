import type { Idea } from "@/lib/types";

export type DogfoodCriterion = {
  id: number;
  label: string;
  /** Si se puede inferir desde ideas locales */
  auto?: "captured" | "directions" | "ready_or_recorded" | null;
  requiredForGo?: boolean;
};

export const DOGFOOD_CRITERIA: DogfoodCriterion[] = [
  {
    id: 1,
    label: "Capturé ideas en contexto real (fuera del escritorio) varias veces",
    auto: "captured",
  },
  {
    id: 2,
    label: "Las 3 direcciones me ayudaron a decidir más rápido que un chat en blanco",
  },
  {
    id: 3,
    label: "Al menos 3 videos salieron de un borrador de la app",
    auto: "ready_or_recorded",
    requiredForGo: true,
  },
  {
    id: 4,
    label: "El tiempo idea → claridad grabable bajó vs mi método anterior",
  },
  {
    id: 5,
    label: "El contexto de nicho se notó en los enfoques (no genéricos)",
  },
  {
    id: 6,
    label: "Abrí la app por costumbre, no solo para probar el proyecto",
    requiredForGo: true,
  },
  {
    id: 7,
    label: "La fricción que queda es tolerable",
  },
  {
    id: 8,
    label: "Se lo recomendaría a un creador amigo sin inventar features futuras",
  },
];

export type DogfoodAnswers = Record<string, boolean | null>;

const STORAGE_KEY = "ideazo_dogfood_checklist_v1";

export function loadDogfoodAnswers(): DogfoodAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DogfoodAnswers;
  } catch {
    return {};
  }
}

export function saveDogfoodAnswers(answers: DogfoodAnswers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    /* ignore */
  }
}

export function computeDogfoodStats(ideas: Idea[]) {
  const active = ideas.filter((i) => i.status !== "archived");
  const captured = active.length;
  const withDirections = active.filter((i) => (i.directions?.length || 0) >= 3)
    .length;
  const readyOrRecorded = active.filter(
    (i) => i.status === "ready" || i.status === "recorded"
  ).length;
  return { captured, withDirections, readyOrRecorded };
}

export function autoHint(
  criterion: DogfoodCriterion,
  stats: ReturnType<typeof computeDogfoodStats>
): boolean | null {
  if (!criterion.auto) return null;
  if (criterion.auto === "captured") return stats.captured >= 8;
  if (criterion.auto === "directions") return stats.withDirections >= 5;
  if (criterion.auto === "ready_or_recorded") return stats.readyOrRecorded >= 3;
  return null;
}

export function evaluateGo(answers: DogfoodAnswers): {
  yesCount: number;
  go: boolean;
  missingRequired: number[];
} {
  let yesCount = 0;
  const missingRequired: number[] = [];
  for (const c of DOGFOOD_CRITERIA) {
    const v = answers[String(c.id)];
    if (v === true) yesCount += 1;
    if (c.requiredForGo && v !== true) missingRequired.push(c.id);
  }
  const go = yesCount >= 6 && missingRequired.length === 0;
  return { yesCount, go, missingRequired };
}
