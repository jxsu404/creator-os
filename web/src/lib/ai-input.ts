import { NextResponse } from "next/server";

/** Límites de caracteres para payloads de rutas /api/generate-*. */
export const AI_INPUT_CAPS = {
  ideaText: 4000,
  adjustment: 2000,
  /** Perfiles content_os (brand + juego + estilo) suelen pasar de 3k. */
  profileContext: 4500,
  /** Guiones largos por bloques pueden superar el short (~6k). */
  script: 20000,
  recentContent: 3000,
  existingTitle: 200,
  directionField: 500,
  /** Revisiones de guion largo (hook + bloques + cierre). */
  currentDraftJson: 24000,
  thumbnailIdea: 200,
} as const;

export type InputFieldCheck = {
  value: string | undefined | null;
  max: number;
  label: string;
};

/** Recorta sin romper a mitad de palabra cuando se puede. */
export function clampAiText(
  value: string | undefined | null,
  max: number
): string {
  const raw = value ?? "";
  if (raw.length <= max) return raw;
  const sliced = raw.slice(0, max);
  const lastBreak = Math.max(
    sliced.lastIndexOf("\n"),
    sliced.lastIndexOf(" ")
  );
  if (lastBreak > max * 0.7) {
    return sliced.slice(0, lastBreak).trimEnd();
  }
  return sliced.trimEnd();
}

export function rejectIfTooLong(
  value: string | undefined | null,
  max: number,
  label: string
): NextResponse | null {
  if (value != null && value.length > max) {
    return NextResponse.json(
      {
        error: `${label} es demasiado largo. Acórtalo e intenta de nuevo.`,
      },
      { status: 400 }
    );
  }
  return null;
}

export function rejectIfAnyTooLong(
  checks: InputFieldCheck[]
): NextResponse | null {
  for (const { value, max, label } of checks) {
    const rejected = rejectIfTooLong(value, max, label);
    if (rejected) return rejected;
  }
  return null;
}

export function aiRouteError(
  route: string,
  err: unknown,
  clientMessage: string
): NextResponse {
  console.error(`[${route}]`, err);
  return NextResponse.json({ error: clientMessage }, { status: 500 });
}
