import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook processing is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Webhook signature verification failed." },
        { status: 400 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session.id) {
          console.error("Checkout session completed without session id.");
          break;
        }

        const supabase = getSupabaseAdmin();

        const { error: donationUpdateError } = await supabase
          .from("donations")
          .update({ status: "paid" })
          .eq("stripe_session_id", session.id)
          .eq("status", "pending");

        if (donationUpdateError) {
          console.error("Failed to mark donation as paid:", donationUpdateError.message);
        }

        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("stripe_session_id", session.id)
          .eq("status", "pending");

        if (orderUpdateError) {
          console.error("Failed to mark order as paid:", orderUpdateError.message);
          return NextResponse.json(
            { error: "Unable to reconcile order record." },
            { status: 500 },
          );
        }

        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }
}
