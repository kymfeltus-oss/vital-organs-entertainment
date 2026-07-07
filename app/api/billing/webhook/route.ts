import { NextResponse } from "next/server";
import Stripe from "stripe";
import { syncTenantTierFromSubscription } from "@/lib/billing/tenant-tier-sync";
import { getStripeSecretKey } from "@/lib/checkout/server";

function getStripeClient(): Stripe {
  const stripeSecretKey = getStripeSecretKey();
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(stripeSecretKey);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration tokens." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook signature verification failed.";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "invoice.payment_succeeded"
  ) {
    try {
      let subscriptionObject: Stripe.Subscription | null = null;

      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionRef = invoice.subscription;

        if (typeof subscriptionRef === "string") {
          subscriptionObject = await getStripeClient().subscriptions.retrieve(subscriptionRef);
        } else if (subscriptionRef && typeof subscriptionRef === "object") {
          subscriptionObject = subscriptionRef;
        }
      } else {
        subscriptionObject = event.data.object as Stripe.Subscription;
      }

      if (subscriptionObject) {
        await syncTenantTierFromSubscription(subscriptionObject, {
          forceTier: event.type === "customer.subscription.deleted" ? "starter" : undefined,
        });
      }
    } catch (error) {
      console.error("[billing/webhook] tenant tier update failed:", error);
      return NextResponse.json({ error: "Failed to update tenant tier." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
