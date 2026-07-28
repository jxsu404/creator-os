import { NextResponse } from "next/server";
import { getBillingSnapshot } from "@/lib/billing/usage";
import { FREE_MONTHLY_GENERATIONS } from "@/lib/billing/plans";
import { getApiAuth } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await getApiAuth();
  if (!auth) {
    return NextResponse.json({
      configured: false,
      plans: {
        free: { limit: FREE_MONTHLY_GENERATIONS },
      },
      billing: null,
    });
  }

  const billing = await getBillingSnapshot(auth.supabase, auth.user.id);
  return NextResponse.json({
    configured: true,
    plans: {
      free: { limit: FREE_MONTHLY_GENERATIONS },
    },
    billing,
  });
}
