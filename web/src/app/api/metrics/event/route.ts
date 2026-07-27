import { NextResponse } from "next/server";
import { getApiAuth } from "@/lib/supabase/admin";

const ALLOWED = new Set([
  "signup",
  "onboarding_complete",
  "idea_captured",
  "directions_generated",
  "draft_ready",
  "marked_ready",
  "hit_limit",
  "upgrade_click",
  "checkout_started",
  "checkout_success",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: string;
      meta?: Record<string, unknown>;
    };
    const event = body.event?.trim();
    if (!event || !ALLOWED.has(event)) {
      return NextResponse.json({ error: "Evento no permitido." }, { status: 400 });
    }

    const auth = await getApiAuth();
    if (!auth) {
      // Sin sesión: aceptar solo waitlist-ish events no; omitimos persistencia
      return NextResponse.json({ ok: true, stored: false });
    }

    const { error } = await auth.supabase.from("funnel_events").insert({
      user_id: auth.user.id,
      event,
      meta: body.meta || {},
    });

    if (error) {
      // Tabla aún no migrada: no romper UX
      console.warn("[metrics]", error.message);
      return NextResponse.json({ ok: true, stored: false });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch (err) {
    console.warn("[metrics]", err);
    return NextResponse.json({ ok: true, stored: false });
  }
}
