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
  "donate_click",
]);

const META_KEYS = new Set(["ideaId", "plan", "source", "path"]);
const MAX_META_BYTES = 2048;

function sanitizeMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!META_KEYS.has(key)) continue;
    if (typeof value === "string") {
      out[key] = value.slice(0, 200);
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  if (JSON.stringify(out).length > MAX_META_BYTES) return {};
  return out;
}

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
      meta: sanitizeMeta(body.meta),
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
