import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";

export const runtime = "nodejs";

async function upsertProFromSubscription(
  userId: string,
  sub: Stripe.Subscription
) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    console.error("[stripe webhook] missing SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const status = sub.status;
  const isPro = status === "active" || status === "trialing";
  const periodEnd = (sub as Stripe.Subscription & {
    current_period_end?: number;
  }).current_period_end;

  await admin.from("billing_subscriptions").upsert({
    user_id: userId,
    plan: isPro ? "pro" : "free",
    status,
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  });
}

async function resolveUserId(
  sub: Stripe.Subscription,
  session?: Stripe.Checkout.Session
): Promise<string | null> {
  const fromMeta =
    sub.metadata?.supabase_user_id ||
    session?.metadata?.supabase_user_id ||
    session?.client_reference_id;
  if (fromMeta) return fromMeta;

  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const { data } = await admin
    .from("billing_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data as { user_id?: string } | null)?.user_id || null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Falta STRIPE_WEBHOOK_SECRET" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Firma de webhook inválida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = await resolveUserId(sub, session);
        if (userId) await upsertProFromSubscription(userId, sub);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub);
        if (userId) await upsertProFromSubscription(userId, sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
