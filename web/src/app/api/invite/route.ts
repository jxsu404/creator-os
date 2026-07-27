import { NextResponse } from "next/server";
<<<<<<< HEAD
import { rateLimit } from "@/lib/rate-limit";
=======
import { inviteOnlyEnabled, userHasInviteAccess } from "@/lib/invite-access";
>>>>>>> origin/main
import { getApiAuth } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await getApiAuth();
  if (!auth) {
    return NextResponse.json({
      inviteOnly: inviteOnlyEnabled(),
      authenticated: false,
      granted: false,
    });
  }

  if (!inviteOnlyEnabled()) {
    return NextResponse.json({
      inviteOnly: false,
      authenticated: true,
      granted: true,
    });
  }

  const granted = await userHasInviteAccess(auth.supabase, auth.user.id);

  return NextResponse.json({
    inviteOnly: true,
    authenticated: true,
    granted,
  });
}

export async function POST(request: Request) {
  const auth = await getApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const limited = rateLimit(`invite:${auth.user.id}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)),
        },
      }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Escribe un código de invitación." }, { status: 400 });
  }

  const { error } = await auth.supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("invalid_invite")) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }
    if (msg.includes("invite_exhausted")) {
      return NextResponse.json(
        { error: "Ese código ya no tiene usos." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No pude validar el código." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, granted: true });
}
