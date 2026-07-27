import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Callback OAuth / magic link — intercambio del code en el servidor
 * (cookies), no en el cliente. Evita "PKCE code verifier not found".
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextRaw = searchParams.get("next") || "/";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return NextResponse.redirect(`${origin}${next}`);
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "magiclink" | "signup" | "invite" | "recovery",
      });
      if (error) throw error;
      return NextResponse.redirect(`${origin}${next}`);
    }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "No pude completar el inicio de sesión.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "El enlace no trae sesión. Vuelve a intentar Continuar con Google."
    )}`
  );
}
