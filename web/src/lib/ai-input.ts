import { NextResponse } from "next/server";

/** Límites de caracteres para payloads de rutas /api/generate-*. */
export const AI_INPUT_CAPS = {
  ideaText: 4000,
  adjustment: 2000,
  profileContext: 3000,
  script: 6000,
  recentContent: 3000,
  existingTitle: 200,
  directionField: 500,
  currentDraftJson: 6000,
} as const;

export type InputFieldCheck = {
  value: string | undefined | null;
  max: number;
  label: string;
};

export function rejectIfTooLong(
  value: string | undefined | null,
  max: number,
  label: string
): NextResponse | null {
  if (value != null && value.length > max) {
    return NextResponse.json(
      {
        error: `El texto de ${label} es demasiado largo. Acórtalo e intenta de nuevo.`,
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
