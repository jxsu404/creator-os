import { NextResponse } from "next/server";
import { createSupabaseAdmin, getApiAuth } from "@/lib/supabase/admin";
import {
  appOrigin,
  getStripe,
  isStripeConfigured,
  stripePriceId,
} from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe aún no está configurado en este entorno." },
        { status: 503 }
      );
    }

    const auth = await getApiAuth();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      interval?: "month" | "year";
    };
    const interval = body.interval === "year" ? "year" : "month";
    const priceId = stripePriceId(interval);
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            interval === "year"
              ? "Falta STRIPE_PRICE_PRO_YEARLY"
              : "Falta STRIPE_PRICE_PRO_MONTHLY",
        },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const origin = appOrigin(request);
    const admin = createSupabaseAdmin();
    const db = admin || auth.supabase;

    const { data: existing } = await db
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    let customerId =
      (existing as { stripe_customer_id?: string | null } | null)
        ?.stripe_customer_id || undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email || undefined,
        metadata: { supabase_user_id: auth.user.id },
      });
      customerId = customer.id;
      await db.from("billing_subscriptions").upsert({
        user_id: auth.user.id,
        plan: "free",
        status: "active",
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      client_reference_id: auth.user.id,
      metadata: { supabase_user_id: auth.user.id },
      subscription_data: {
        metadata: { supabase_user_id: auth.user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No pude abrir el checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
