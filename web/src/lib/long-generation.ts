/** Prompts + validación del loop YouTube largo (enfoques → guía por bloques). */

import { createId } from "./id";
import type { ScriptBlock } from "./types";
import {
  countWords,
  type NormalizedDirection,
  type RawDirection,
} from "./short-generation";

export const LONG_AXES = ["utilidad", "descubrimiento", "mapa"] as const;
export type LongAxis = (typeof LONG_AXES)[number];

/** Duraciones permitidas para YouTube largo (segundos). */
export const LONG_DURATION_OPTIONS = [
  180, 300, 480, 720, 900, 1200, 1800,
] as const;
export type LongDurationSeconds = (typeof LONG_DURATION_OPTIONS)[number];

export const IDEA_TOO_THIN_FOR_LONG_MESSAGE =
  "Para un video largo de YouTube hace falta una idea más desarrollada: temas a cubrir, en qué orden y qué se lleva el viewer. Amplía un poco e intenta de nuevo.";

export const LONG_SPEAK = {
  hookMaxWords: 40,
  closingMaxWords: 50,
  blockTitleMaxWords: 12,
  blockBodyMinWords: 25,
  minBlocks: 4,
  maxBlocks: 10,
  /** Aviso UI en captura (no bloquea duro si hay ~2–3 frases). */
  thinIdeaWarnWords: 40,
  secondsDefault: 600 as LongDurationSeconds,
  secondsMin: 180 as LongDurationSeconds,
  secondsMax: 1800 as LongDurationSeconds,
} as const;

export type LongDraftParts = {
  hook: string;
  scriptBody: string;
  blocks: ScriptBlock[];
  closing: string;
  estimatedSeconds: number;
};

export function isIdeaTooThinForLongPayload(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const o = parsed as Record<string, unknown>;
  if (o.ideaTooThinForLong === true) return true;
  if (typeof o.error === "string" && /idea_too_thin_for_long/i.test(o.error)) {
    return true;
  }
  return false;
}

export function normalizeLongAxis(raw: string | undefined): LongAxis | null {
  const key = (raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (
    key === "utilidad" ||
    key === "practico" ||
    key === "practica" ||
    key === "guia"
  ) {
    return "utilidad";
  }
  if (
    key === "descubrimiento" ||
    key === "journey" ||
    key === "tour" ||
    key === "experiencia"
  ) {
    return "descubrimiento";
  }
  if (
    key === "mapa" ||
    key === "sistemas" ||
    key === "estructura" ||
    key === "overview"
  ) {
    return "mapa";
  }
  return null;
}

function normalizeLongDirections(
  raw: Array<Partial<RawDirection> | null | undefined> | undefined
): Array<NormalizedDirection & { axis: LongAxis | null }> {
  return (raw || [])
    .map((d) => ({
      name: String(d?.name || "").trim(),
      promise: String(d?.promise || "").trim(),
      angle: String(d?.angle || "").trim(),
      hook: String(d?.hook || "").trim(),
      why: String(d?.why || "").trim(),
      axis: normalizeLongAxis(d?.axis),
    }))
    .filter((d) => d.name && d.promise && d.angle && d.hook && d.why);
}

/**
 * Exige exactamente 3 enfoques con ejes distintos (utilidad / descubrimiento / mapa).
 */
export function validateLongDirections(
  raw: Array<Partial<RawDirection> | null | undefined> | undefined
): { ok: true; directions: NormalizedDirection[] } | { ok: false; error: string } {
  const normalized = normalizeLongDirections(raw);
  if (normalized.length < 3) {
    return {
      ok: false,
      error: "No pude armar buenos enfoques. Intenta de nuevo.",
    };
  }

  const three = normalized.slice(0, 3);
  const axes = three.map((d) => d.axis);
  if (axes.some((a) => !a)) {
    return {
      ok: false,
      error: "Los enfoques no salieron bien diferenciados. Intenta de nuevo.",
    };
  }

  const unique = new Set(axes);
  if (unique.size < 3) {
    return {
      ok: false,
      error: "Los enfoques se parecieron demasiado. Intenta de nuevo.",
    };
  }

  const hooks = three.map((d) => d.hook.toLowerCase());
  const names = three.map((d) => d.name.toLowerCase());
  if (new Set(hooks).size < 3 || new Set(names).size < 3) {
    return {
      ok: false,
      error: "Los enfoques se parecieron demasiado. Intenta de nuevo.",
    };
  }

  return {
    ok: true,
    directions: three.map(({ name, promise, angle, hook, why }) => ({
      name,
      promise,
      angle,
      hook,
      why,
    })),
  };
}

/** Encaja la duración a 3 / 5 / 8 / 12 / 15 / 20 / 30 min. Empate → la opción mayor. */
export function snapLongEstimatedSeconds(value: unknown): LongDurationSeconds {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return LONG_SPEAK.secondsDefault;
  }
  const clamped = Math.min(
    LONG_SPEAK.secondsMax,
    Math.max(LONG_SPEAK.secondsMin, value)
  );
  let best: LongDurationSeconds = LONG_DURATION_OPTIONS[0];
  let bestDist = Infinity;
  for (const opt of LONG_DURATION_OPTIONS) {
    const dist = Math.abs(opt - clamped);
    if (dist < bestDist || (dist === bestDist && opt > best)) {
      best = opt;
      bestDist = dist;
    }
  }
  return best;
}

type RawBlock = { title?: string; body?: string; id?: string };

function normalizeBlocks(
  raw: Array<RawBlock | null | undefined> | undefined
): ScriptBlock[] {
  return (raw || [])
    .map((b) => ({
      id:
        typeof b?.id === "string" && b.id.trim()
          ? b.id.trim()
          : createId("block"),
      title: String(b?.title || "").trim(),
      body: String(b?.body || "").trim(),
    }))
    .filter((b) => b.title && b.body);
}

/**
 * Valida guía larga: hook + 4–10 bloques temáticos + cierre.
 */
export function validateLongDraft(parts: {
  hook?: string;
  closing?: string;
  blocks?: Array<RawBlock | null | undefined>;
  estimatedSeconds?: number;
}): { ok: true; draft: LongDraftParts } | { ok: false; error: string } {
  const hook = typeof parts.hook === "string" ? parts.hook.trim() : "";
  const closing =
    typeof parts.closing === "string" ? parts.closing.trim() : "";
  const blocks = normalizeBlocks(parts.blocks);

  if (!hook) {
    return {
      ok: false,
      error: "La guía llegó incompleta. Intenta de nuevo.",
    };
  }

  if (
    blocks.length < LONG_SPEAK.minBlocks ||
    blocks.length > LONG_SPEAK.maxBlocks
  ) {
    return {
      ok: false,
      error: "La guía por bloques no salió bien. Intenta de nuevo.",
    };
  }

  for (const block of blocks) {
    if (countWords(block.body) < LONG_SPEAK.blockBodyMinWords) {
      return {
        ok: false,
        error: "La guía por bloques no salió bien. Intenta de nuevo.",
      };
    }
  }

  const scriptBody = blocks.map((b) => b.body).join("\n\n");

  return {
    ok: true,
    draft: {
      hook,
      scriptBody,
      blocks,
      closing,
      estimatedSeconds: snapLongEstimatedSeconds(parts.estimatedSeconds),
    },
  };
}

/** ¿La idea en captura parece demasiado corta para un largo? (aviso UI). */
export function isThinLongIdeaText(ideaText: string): boolean {
  return countWords(ideaText) < LONG_SPEAK.thinIdeaWarnWords;
}

const LONG_DURATION_RULES = `DURACIÓN (elige UNA según cuánto hay que decir, sin relleno):
- Solo: 180, 300, 480, 720, 900, 1200 o 1800 segundos (3–30 min).
- 180 = intro densa · 300–480 = guía media · 720–900 = tutorial con varios sistemas · 1200–1800 = tour amplio.
- Si la idea es demasiado pobre (una frase sin temas ni orden) para un video largo HONESTO: responde exactamente {"ideaTooThinForLong": true}.
- No inventes relleno para alargar; elige la duración justa al contenido real de la idea.`;

export function buildLongDirectionsPrompt(
  ideaText: string,
  profileContext?: string
): string {
  return `Eres un compañero creativo para creadores de YouTube (video largo, 3–30 min).
Tu trabajo: convertir una idea DESARROLLADA en exactamente 3 ENFOQUES DISTINTOS entre los que el creador pueda elegir.

FORMATO: YouTube largo (no short vertical). Idioma: español natural (como se habla).
${LONG_DURATION_RULES}

LOS 3 ENFOQUES DEBEN USAR EJES DIFERENTES — uno de cada:
1) "utilidad" — guía práctica / qué priorizar / errores a evitar
2) "descubrimiento" — journey / primeras horas / "lo descubro contigo"
3) "mapa" — overview por sistemas / mapa mental del tema

Regla de oro: si el creador podría elegir los tres indistintamente, fallaste. Deben sentirse como 3 videos distintos.
Prohibido: tres longitudes del mismo guion; plan de cámara; tomas; promesas de viralidad.

Conserva los HECHOS concretos de la idea. No inventes stats, códigos ni patch notes.
Si hay contexto de juego/estilo: úsalo. Si la idea NO es de ese juego, IGNORA el bloque de juego.

Si la idea da para un largo honesto, responde SOLO JSON:
{
  "directions": [
    {
      "axis": "utilidad" | "descubrimiento" | "mapa",
      "name": "3-6 palabras",
      "promise": "qué se lleva el viewer en una frase",
      "angle": "ángulo narrativo concreto",
      "hook": "una línea hablada de gancho",
      "why": "cuándo encaja este enfoque (una frase)"
    }
  ]
}
Exactamente 3 objetos. Cada "axis" distinto. Sin markdown ni texto fuera del JSON.

Contexto del creador:
${profileContext?.trim() || "No especificado"}

Idea:
${ideaText.trim()}`;
}

export function buildLongDraftPrompt(opts: {
  ideaText: string;
  profileContext?: string;
  direction: {
    name: string;
    promise: string;
    angle: string;
    hook: string;
    why: string;
  };
  adjustment?: string;
  currentDraft?: {
    hook: string;
    scriptBody?: string;
    closing: string;
    estimatedSeconds: number;
    blocks?: Array<{ title: string; body: string }>;
  };
  isRevision: boolean;
}): string {
  const { ideaText, profileContext, direction, adjustment, currentDraft, isRevision } =
    opts;

  const revisionBlock = isRevision
    ? `El creador ya tiene este borrador y pide AJUSTES. Reescribe la guía completa (hook + bloques + cierre) aplicando los ajustes, sin perder lo que funciona ni traicionar el enfoque:

Borrador actual:
${JSON.stringify(currentDraft, null, 2)}

Ajustes pedidos:
${adjustment!.trim()}`
    : `Ajuste inicial del creador: ${adjustment?.trim() || "Ninguno"}`;

  return `Eres un compañero creativo. Armas una GUÍA PARA GRABAR de un video LARGO de YouTube (3–30 min).
Idioma: español hablado. Sin relleno. Sin promesas de viralidad.
PROHIBIDO: plan de cámara, tomas, beats, "show", B-roll, timeline de edición.

CONTRATO CON EL ENFOQUE ELEGIDO (obligatorio):
- El "hook" debe REFINAR el hook base del enfoque.
- Los bloques deben cumplir la PROMESA del enfoque.
- No cambies el ángulo creativo salvo que el ajuste lo pida.

${LONG_DURATION_RULES}

ESTRUCTURA OBLIGATORIA:
- hook: gancho hablado (máx ~${LONG_SPEAK.hookMaxWords} palabras), primeros segundos.
- blocks: ${LONG_SPEAK.minBlocks}–${LONG_SPEAK.maxBlocks} bloques TEMÁTICOS. Cada uno = un tema/sección con:
  - title: nombre corto del tema (ayuda a grabar y editar por partes)
  - body: guion hablado de esa sección (palabra por palabra, sin instrucciones de cámara)
- closing: cierre + CTA verbal (máx ~${LONG_SPEAK.closingMaxWords} palabras).
- Cada bloque cubre UN tema distinto; el orden debe servir para editar por capítulos.

HECHOS: conserva claims concretos de la idea. No inventes stats/códigos/patch notes.
Si hay "ASÍ SUENA TU CONTENIDO": síguelo. Ignora "Descripciones de YouTube".

Si la idea da para un largo, responde SOLO JSON:
{
  "hook": "gancho hablado",
  "blocks": [
    { "title": "Tema corto", "body": "guion hablado de la sección…" }
  ],
  "closing": "cierre/CTA verbal",
  "estimatedSeconds": 180 | 300 | 480 | 720 | 900 | 1200 | 1800
}

Contexto del creador:
${profileContext?.trim() || "No especificado"}

Idea:
${ideaText.trim()}

Enfoque elegido (NO lo traiciones):
- Nombre: ${direction.name}
- Promesa: ${direction.promise}
- Ángulo: ${direction.angle}
- Hook base (refínalo, no lo sustituyas por otro concepto): ${direction.hook}
- Por qué: ${direction.why}

${revisionBlock}`;
}

/**
 * Guion largo directo: idea YA decidida → bloques sin inventar otro ángulo.
 */
export function buildDirectLongDraftPrompt(opts: {
  ideaText: string;
  profileContext?: string;
  adjustment?: string;
  currentDraft?: {
    hook: string;
    scriptBody?: string;
    closing: string;
    estimatedSeconds: number;
    blocks?: Array<{ title: string; body: string }>;
  };
  isRevision: boolean;
}): string {
  const { ideaText, profileContext, adjustment, currentDraft, isRevision } = opts;

  const revisionBlock = isRevision
    ? `El creador ya tiene este borrador y pide AJUSTES. Reescribe la guía completa (hook + bloques + cierre) aplicando los ajustes, sin traicionar lo que YA decidió cubrir:

Borrador actual:
${JSON.stringify(currentDraft, null, 2)}

Ajustes pedidos:
${adjustment!.trim()}`
    : `Ajuste inicial del creador: ${adjustment?.trim() || "Ninguno"}`;

  return `Eres un compañero creativo. El creador YA tiene la idea DECIDIDA (temas, orden, qué va a decir).
Tu trabajo: convertir ESA idea en una GUÍA PARA GRABAR de YouTube largo (3–30 min) en bloques temáticos.
NO inventes un ángulo nuevo ni otro video. NO reordenes de forma que cambie el sentido de su plan.
Los bloques deben reflejar los temas que ya trajo; solo pásalos a español hablado listo para grabar/editar.

Idioma: español hablado. Sin relleno. Sin promesas de viralidad.
PROHIBIDO: plan de cámara, tomas, beats, "show", B-roll, timeline de edición.

${LONG_DURATION_RULES}

ESTRUCTURA OBLIGATORIA:
- hook: gancho hablado (máx ~${LONG_SPEAK.hookMaxWords} palabras), alineado con su apertura.
- blocks: ${LONG_SPEAK.minBlocks}–${LONG_SPEAK.maxBlocks} bloques TEMÁTICOS sacados de SU idea:
  - title: nombre corto del tema
  - body: guion hablado de esa sección
- closing: cierre + CTA verbal (máx ~${LONG_SPEAK.closingMaxWords} palabras).

HECHOS: conserva claims concretos. No inventes stats/códigos/patch notes.
Si hay "ASÍ SUENA TU CONTENIDO": síguelo. Ignora "Descripciones de YouTube".

Si la idea da para un largo, responde SOLO JSON:
{
  "hook": "gancho hablado",
  "blocks": [
    { "title": "Tema corto", "body": "guion hablado de la sección…" }
  ],
  "closing": "cierre/CTA verbal",
  "estimatedSeconds": 180 | 300 | 480 | 720 | 900 | 1200 | 1800
}

Contexto del creador:
${profileContext?.trim() || "No especificado"}

Idea YA DECIDIDA (respétala; estructura en bloques sin reinventar):
${ideaText.trim()}

${revisionBlock}`;
}
