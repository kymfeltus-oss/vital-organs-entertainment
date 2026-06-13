import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/checkout/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";

export type StripeHealthPayload = {
  ok: boolean;
  live: boolean;
  detail: string;
  checkedAt: string;
};

/** Lightweight Stripe connectivity probe for the Go Live safety gate. */
export async function GET() {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const checkedAt = new Date().toISOString();
  const stripeSecretKey = getStripeSecretKey();

  if (!stripeSecretKey) {
    return NextResponse.json<StripeHealthPayload>(
      {
        ok: false,
        live: false,
        detail: "Stripe secret key is not configured.",
        checkedAt,
      },
      { status: 200 },
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      timeout: 5_000,
      maxNetworkRetries: 0,
    });

    await stripe.balance.retrieve();

    return NextResponse.json<StripeHealthPayload>({
      ok: true,
      live: true,
      detail: "Stripe API reachable and authenticated.",
      checkedAt,
    });
  } catch (error) {
    const detail =
      error instanceof Stripe.errors.StripeAuthenticationError
        ? "Stripe API key was rejected."
        : "Stripe API is unreachable.";

    console.error("[LIVE_HUB_STRIPE_HEALTH_ERR]:", error);

    return NextResponse.json<StripeHealthPayload>(
      { ok: false, live: false, detail, checkedAt },
      { status: 200 },
    );
  }
}
