import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/checkout/server";

export type StripeHealthPayload = {
  ok: boolean;
  live: boolean;
  detail: string;
  checkedAt: string;
};

/** Lightweight Stripe connectivity probe for ops heartbeat and safety gates. */
export async function probeStripeHealth(): Promise<StripeHealthPayload> {
  const checkedAt = new Date().toISOString();
  const stripeSecretKey = getStripeSecretKey();

  if (!stripeSecretKey) {
    return {
      ok: false,
      live: false,
      detail: "Stripe secret key is not configured.",
      checkedAt,
    };
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      timeout: 5_000,
      maxNetworkRetries: 0,
    });

    await stripe.balance.retrieve();

    return {
      ok: true,
      live: true,
      detail: "Stripe API reachable and authenticated.",
      checkedAt,
    };
  } catch (error) {
    const detail =
      error instanceof Stripe.errors.StripeAuthenticationError
        ? "Stripe API key was rejected."
        : "Stripe API is unreachable.";

    console.error("[OPS_STRIPE_HEALTH_ERR]:", error);

    return {
      ok: false,
      live: false,
      detail,
      checkedAt,
    };
  }
}
