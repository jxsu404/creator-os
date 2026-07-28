/** Prompts + validación del loop short-form (enfoques → guía). */

export const SHORT_AXES = ["utilidad", "opinion", "historia"] as const;
export type ShortAxis = (typeof SHORT_AXES)[number];

/** Duraciones permitidas para un short (segundos). */
export const SHORT_DURATION_OPTIONS = [30, 60, 90, 120, 150] as const;
export type ShortDurationSeconds = (typeof SHORT_DURATION_OPTIONS)[number];

export const TOO_LONG_FOR_SHORT_MESSAGE =
  "Este texto es demasiado largo para un short (máx. ~2 min 30 s). Al crear la idea, elige YouTube largo para videos de 3–30 min.";

export type RawDirection = {
  name: string;
  promise: string;
  angle: string;
  hook: string;
  why: string;
  axis?: string;
};

export type NormalizedDirection = {
  name: string;
  promise: string;
  angle: string;
  hook: string;
  why: string;
};

export type DraftParts = {
  hook: string;
  scriptBody: string;
  closing: string;
  estimatedSeconds: number;
};

export const SHORT_SPEAK = {
  hookMaxWords: 22,
  /** Mínimo de cuerpo para no devolver casi vacío */
  bodyMinWords: 15,
  /**
   * Techo duro ~2:30 de habla (~2.5 palabras/s).
   * La duración elegida marca el tamaño real en el prompt.
   */
  bodyHardMaxWords: 400,
  closingMaxWords: 28,
  secondsDefault: 60 as ShortDurationSeconds,
  secondsMax: 150 as ShortDurationSeconds,
} as const;

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** True si el modelo marcó la idea como demasiado larga para short. */
export function isTooLongForShortPayload(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const o = parsed as Record<string, unknown>;
  if (o.tooLongForShort === true) return true;
  if (typeof o.error === "string" && /too_long_for_short/i.test(o.error)) {
    return true;
  }
  return false;
}

export function normalizeAxis(raw: string | undefined): ShortAxis | null {
  const key = (raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (key === "utilidad" || key === "practico" || key === "practica") {
    return "utilidad";
  }
  if (key === "opinion" || key === "controvertido") {
    return "opinion";
  }
  if (key === "historia" || key === "story" || key === "narrativo") {
    return "historia";
  }
  return null;
}

/** Normaliza campos y exige los 5 strings. */
export function normalizeDirections(
  raw: Array<Partial<RawDirection> | null | undefined> | undefined
): Array<NormalizedDirection & { axis: ShortAxis | null }> {
  return (raw || [])
    .map((d) => ({
      name: String(d?.name || "").trim(),
      promise: String(d?.promise || "").trim(),
      angle: String(d?.angle || "").trim(),
      hook: String(d?.hook || "").trim(),
      why: String(d?.why || "").trim(),
      axis: normalizeAxis(d?.axis),
    }))
    .filter((d) => d.name && d.promise && d.angle && d.hook && d.why);
}

/**
 * Exige exactamente 3 enfoques con ejes distintos (utilidad / opinión / historia).
 * Devuelve los 3 listos para el cliente (sin `axis`) o un error en español.
 */
export function validateShortDirections(
  raw: Array<Partial<RawDirection> | null | undefined> | undefined
): { ok: true; directions: NormalizedDirection[] } | { ok: false; error: string } {
  const normalized = normalizeDirections(raw);
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

/** Encaja la duración a 30 / 60 / 90 / 120 / 150. Empate → la opción mayor. */
export function snapEstimatedSeconds(value: unknown): ShortDurationSeconds {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return SHORT_SPEAK.secondsDefault;
  }
  let best: ShortDurationSeconds = SHORT_DURATION_OPTIONS[0];
  let bestDist = Infinity;
  for (const opt of SHORT_DURATION_OPTIONS) {
    const dist = Math.abs(opt - value);
    if (dist < bestDist || (dist === bestDist && opt > best)) {
      best = opt;
      bestDist = dist;
    }
  }
  return best;
}

/** @deprecated alias — usar snapEstimatedSeconds */
export function clampEstimatedSeconds(value: unknown): number {
  return snapEstimatedSeconds(value);
}

/**
 * Valida guía short: hook + cuerpo obligatorios, cuerpo hablable hasta ~2:30.
 */
export function validateShortDraft(parts: {
  hook?: string;
  scriptBody?: string;
  closing?: string;
  estimatedSeconds?: number;
}): { ok: true; draft: DraftParts } | { ok: false; error: string } {
  const hook = typeof parts.hook === "string" ? parts.hook.trim() : "";
  const scriptBody =
    typeof parts.scriptBody === "string" ? parts.scriptBody.trim() : "";
  const closing =
    typeof parts.closing === "string" ? parts.closing.trim() : "";

  if (!hook || !scriptBody) {
    return {
      ok: false,
      error: "La guía llegó incompleta. Intenta de nuevo.",
    };
  }

  const bodyWords = countWords(scriptBody);
  if (bodyWords > SHORT_SPEAK.bodyHardMaxWords) {
    return {
      ok: false,
      error: TOO_LONG_FOR_SHORT_MESSAGE,
    };
  }
  if (bodyWords < SHORT_SPEAK.bodyMinWords) {
    return {
      ok: false,
      error: "La guía llegó incompleta. Intenta de nuevo.",
    };
  }

  return {
    ok: true,
    draft: {
      hook,
      scriptBody,
      closing,
      estimatedSeconds: snapEstimatedSeconds(parts.estimatedSeconds),
    },
  };
}

const DURATION_RULES = `DURACIÓN (elige UNA según cuánto hay que decir, sin relleno):
- Solo: 30, 60, 90, 120 o 150 segundos (2 min 30 s máximo).
- 30 = tip/punch muy corto · 60 = short típico · 90–120 = explicación con algo de carne · 150 = tope para TikTok/Shorts denso.
- Si la idea (hechos + puntos a cubrir) NO cabe con honestidad en 150 s sin recortar el sentido, NO inventes un short incompleto: responde exactamente {"tooLongForShort": true}.
- No aplastes una idea media a 30–60 s si necesita más aire; elige la duración justa.`;

export function buildDirectionsPrompt(
  ideaText: string,
  profileContext?: string
): string {
  return `Eres un compañero creativo para creadores de TikTok / Reels / Shorts (vertical corto).
Tu trabajo: convertir una idea en exactamente 3 ENFOQUES DISTINTOS entre los que el creador pueda elegir con criterio claro.

FORMATO: short vertical. Idioma: español natural (como se habla, no como se escribe un blog).
${DURATION_RULES}

LOS 3 ENFOQUES DEBEN USAR EJES DIFERENTES — uno de cada:
1) "utilidad" — tip práctico / cómo hacerlo / error a evitar
2) "opinion" — toma de postura / mito vs realidad / hot take
3) "historia" — anécdota / antes-después / momento concreto

Regla de oro: si el creador podría elegir los tres indistintamente, fallaste. Deben sentirse como 3 videos distintos, no 3 títulos del mismo video.
Prohibido: tres longitudes distintas del mismo guion; tres "estilos de redacción"; preguntas disfrazadas de opciones; promesas de viralidad; clichés forzados del nicho.

Conserva los HECHOS concretos de la idea (nombres, números, claims). No inventes patch notes, stats ni códigos.
Si hay contexto de juego/estilo: úsalo (vocabulario, ritmo, tipos de video). Si la idea NO es de ese juego, IGNORA el bloque de juego.

Si la idea cabe en un short (≤150 s), responde SOLO JSON:
{
  "directions": [
    {
      "axis": "utilidad" | "opinion" | "historia",
      "name": "3-6 palabras",
      "promise": "qué se lleva el viewer en una frase",
      "angle": "ángulo narrativo concreto (no repitas solo la palabra del axis)",
      "hook": "una línea hablada de gancho (máx ~15 palabras)",
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

export function buildDraftPrompt(opts: {
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
    scriptBody: string;
    closing: string;
    estimatedSeconds: number;
  };
  isRevision: boolean;
}): string {
  const { ideaText, profileContext, direction, adjustment, currentDraft, isRevision } =
    opts;

  const revisionBlock = isRevision
    ? `El creador ya tiene este borrador y pide AJUSTES. Reescribe la guía completa aplicando los ajustes, sin perder lo que funciona ni traicionar el enfoque elegido:

Borrador actual:
${JSON.stringify(currentDraft, null, 2)}

Ajustes pedidos:
${adjustment!.trim()}`
    : `Ajuste inicial del creador: ${adjustment?.trim() || "Ninguno"}`;

  return `Eres un compañero creativo. Armas una GUÍA PARA GRABAR de un SHORT (TikTok / Reels / Shorts).
Idioma: español hablado. Sin relleno. Sin promesas de viralidad. Sin plan de cámara ni tomas.

CONTRATO CON EL ENFOQUE ELEGIDO (obligatorio):
- El "hook" de la guía debe REFINAR el hook base del enfoque (misma idea / misma promesa emocional), no inventar otro video.
- El cuerpo debe cumplir la PROMESA del enfoque.
- No cambies el ángulo creativo salvo que el ajuste del creador lo pida explícitamente.

${DURATION_RULES}
- hook: 1 frase corta (máx ~${SHORT_SPEAK.hookMaxWords} palabras), primeros segundos.
- scriptBody: guion palabra por palabra, calibrado a la duración elegida (~2–2.5 palabras por segundo al hablar). Sin secciones de video largo de YouTube.
- closing: 1 línea de cierre/CTA verbal (máx ~${SHORT_SPEAK.closingMaxWords} palabras).

HECHOS: conserva claims concretos de la idea. No inventes stats, códigos ni patch notes que no estén en el contexto.
Si hay "ASÍ SUENA TU CONTENIDO": síguelo. "Cómo grabo" = estructura; "Voz y ritmo" = tono. Ignora "Descripciones de YouTube". No asumas facecam salvo que lo diga.
Si la idea no es de ese juego, no fuerces el contexto del juego.

Si cabe en short, responde SOLO JSON:
{
  "hook": "gancho hablado",
  "scriptBody": "cuerpo del guion palabra por palabra",
  "closing": "cierre/CTA verbal una línea",
  "estimatedSeconds": 30 | 60 | 90 | 120 | 150
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
