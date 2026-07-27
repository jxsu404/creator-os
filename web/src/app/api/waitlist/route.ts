import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
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
      // unique already exists → still ok
      if (!error.message.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No pude apuntarte a la lista.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
