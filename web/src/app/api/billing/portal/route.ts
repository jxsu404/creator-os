import { NextResponse } from "next/server";
import { getApiAuth } from "@/lib/supabase/admin";
import { appOrigin, getStripe, isStripeConfigured } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe aún no está configurado." },
        { status: 503 }
      );
    }

    const auth = await getApiAuth();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data } = await auth.supabase
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    const customerId = (data as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "Aún no tienes un cliente de facturación. Suscríbete primero." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin = appOrigin(request);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/profile`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No pude abrir el portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
