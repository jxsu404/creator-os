import { NextResponse } from "next/server";
import { getAiProvidersStatus } from "@/lib/ai";
import { formatRemaining } from "@/lib/ai-cooldowns";
import { unauthorizedApiResponse } from "@/lib/supabase/require-api-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await unauthorizedApiResponse();
  if (denied) return denied;

  const providers = getAiProvidersStatus().map((p) => ({
    ...p,
    remainingLabel:
      p.remainingMs > 0 ? formatRemaining(p.remainingMs) : p.remainingLabel,
  }));

  const anyAvailable = providers.some((p) => p.available);
  const nextReady = providers
    .filter((p) => p.configured && !p.available && p.remainingMs > 0)
    .sort((a, b) => a.remainingMs - b.remainingMs)[0];

  return NextResponse.json({
    providers,
    anyAvailable,
    nextReady: nextReady
      ? {
          id: nextReady.id,
          label: nextReady.label,
          remainingMs: nextReady.remainingMs,
          remainingLabel: nextReady.remainingLabel,
        }
      : null,
    serverTime: new Date().toISOString(),
  });
}
