import { NextResponse } from "next/server";
import type { BillingSnapshot } from "@/lib/billing/plans";
import {
  consumeGeneration,
  UsageLimitError,
  UsagePersistenceError,
  usageLimitResponse,
  usagePersistenceResponse,
} from "@/lib/billing/usage";
import { inviteOnlyEnabled, userHasInviteAccess } from "@/lib/invite-access";
import { getApiAuth } from "@/lib/supabase/admin";
import { unauthorizedApiResponse } from "@/lib/supabase/require-api-user";

export type AiGateOk = {
  blocked: null;
  billing: BillingSnapshot | null;
};

export type AiGateBlocked = {
  blocked: NextResponse;
};

/**
 * Auth + cupo de generación IA por usuario.
 * - Sin Supabase: pasa (modo local).
 * - Con sesión: consume 1 del cupo mensual de ese user_id.
 * - INVITE_ONLY: exige fila en user_access (misma regla que /api/invite).
 */
export async function gateAiGeneration(): Promise<AiGateOk | AiGateBlocked> {
  const denied = await unauthorizedApiResponse();
  if (denied) return { blocked: denied };

  const auth = await getApiAuth();
  if (!auth) return { blocked: null, billing: null };

  if (inviteOnlyEnabled()) {
    const granted = await userHasInviteAccess(auth.supabase, auth.user.id);
    if (!granted) {
      return {
        blocked: NextResponse.json(
          {
            error: "Necesitas una invitación para usar Ideazo.",
            code: "invite_required",
          },
          { status: 403 }
        ),
      };
    }
  }

  try {
    const billing = await consumeGeneration(auth.supabase, auth.user.id);
    return { blocked: null, billing };
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return {
        blocked: NextResponse.json(usageLimitResponse(err), { status: 402 }),
      };
    }
    if (err instanceof UsagePersistenceError) {
      return {
        blocked: NextResponse.json(usagePersistenceResponse(err), {
          status: 500,
        }),
      };
    }
    throw err;
  }
}
