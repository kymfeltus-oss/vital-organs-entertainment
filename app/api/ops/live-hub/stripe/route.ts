import { NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { probeStripeHealth, type StripeHealthPayload } from "@/lib/ops/stripe-health";

/** Lightweight Stripe connectivity probe for the Go Live safety gate. */
export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const health = await probeStripeHealth();
    return NextResponse.json<StripeHealthPayload>(health, { status: 200 });
  } catch (error) {
    console.error("[LIVE_HUB_STRIPE_ROUTE_ERR]:", error);
    return NextResponse.json<StripeHealthPayload>(
      {
        ok: false,
        live: false,
        detail: "Stripe health probe failed.",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}

export type { StripeHealthPayload };
