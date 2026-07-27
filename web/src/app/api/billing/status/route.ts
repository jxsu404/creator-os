import { NextResponse } from "next/server";
import { getBillingSnapshot } from "@/lib/billing/usage";
import {
  FREE_MONTHLY_GENERATIONS,
  PRO_MONTHLY_GENERATIONS,
  PRO_PRICE_MONTHLY_USD,
  PRO_PRICE_YEARLY_USD,
} from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { getApiAuth } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await getApiAuth();
  if (!auth) {
    return NextResponse.json({
      configured: false,
      stripeReady: isStripeConfigured(),
      plans: {
        free: { limit: FREE_MONTHLY_GENERATIONS, priceMonthly: 0 },
        pro: {
          limit: PRO_MONTHLY_GENERATIONS,
          priceMonthly: PRO_PRICE_MONTHLY_USD,
          priceYearly: PRO_PRICE_YEARLY_USD,
        },
      },
      billing: null,
    });
  }

  const billing = await getBillingSnapshot(auth.supabase, auth.user.id);
  return NextResponse.json({
    configured: true,
    stripeReady: isStripeConfigured(),
    plans: {
      free: { limit: FREE_MONTHLY_GENERATIONS, priceMonthly: 0 },
      pro: {
        limit: PRO_MONTHLY_GENERATIONS,
        priceMonthly: PRO_PRICE_MONTHLY_USD,
        priceYearly: PRO_PRICE_YEARLY_USD,
      },
    },
    billing,
  });
}
