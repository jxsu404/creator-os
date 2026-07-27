import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

const WAITLIST_ERROR =
  "No pude apuntarte a la lista. Inténtalo de nuevo en un momento.";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`waitlist:${ip}`, {
      limit: 5,
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

    const body = (await request.json()) as { email?: string; source?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const supabase = admin || (await createSupabaseServer());
    if (!supabase) {
      return NextResponse.json(
        { error: "Waitlist no disponible (falta Supabase)." },
        { status: 503 }
      );
    }

    const { error } = await supabase.from("waitlist").upsert(
      {
        email,
        source: body.source?.trim() || "web",
      },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) {
      if (!error.message.toLowerCase().includes("duplicate")) {
        console.error("[waitlist] upsert failed:", error.message);
        return NextResponse.json({ error: WAITLIST_ERROR }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] unexpected error:", err);
    return NextResponse.json({ error: WAITLIST_ERROR }, { status: 500 });
  }
}
