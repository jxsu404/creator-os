import { NextResponse } from "next/server";
import {
  consumeGeneration,
  UsageLimitError,
  usageLimitResponse,
} from "@/lib/billing/usage";
import { getApiAuth } from "@/lib/supabase/admin";
import { unauthorizedApiResponse } from "@/lib/supabase/require-api-user";

/**
 * Auth + cupo de generación IA.
 * - Sin Supabase: pasa (modo local).
 * - Con sesión: consume 1 del cupo mensual.
 */
export async function gateAiGeneration(): Promise<NextResponse | null> {
  const denied = await unauthorizedApiResponse();
  if (denied) return denied;

  const auth = await getApiAuth();
  if (!auth) return null;

  try {
    await consumeGeneration(auth.supabase, auth.user.id);
    return null;
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(usageLimitResponse(err), { status: 402 });
    }
    throw err;
  }
}
