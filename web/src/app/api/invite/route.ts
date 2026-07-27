import { NextResponse } from "next/server";
import { getApiAuth } from "@/lib/supabase/admin";

function inviteOnlyEnabled() {
  return process.env.INVITE_ONLY === "true" || process.env.INVITE_ONLY === "1";
}

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

  const { data } = await auth.supabase
    .from("user_access")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    inviteOnly: true,
    authenticated: true,
    granted: Boolean(data),
  });
}

export async function POST(request: Request) {
  const auth = await getApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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
