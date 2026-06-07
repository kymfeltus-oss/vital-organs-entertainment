import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type CheckoutRequestBody = {
  amountInCents?: number;
  customerEmail?: string;
};

function getAppUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes("yourActual")
    ) {
      return NextResponse.json(
        { error: "Payment processing is not configured on the server." },
        { status: 500 },
      );
    }

    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes("yourActual")
    ) {
      return NextResponse.json(
        { error: "Supabase server credentials are not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const amountInCents = body.amountInCents;
    const customerEmail = body.customerEmail?.trim();

    if (
      typeof amountInCents !== "number" ||
      !Number.isInteger(amountInCents) ||
      amountInCents < 50
    ) {
      return NextResponse.json(
        { error: "Minimum transaction value not met." },
        { status: 400 },
      );
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { error: "A valid customer email is required." },
        { status: 400 },
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = getAppUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountInCents,
            product_data: {
              name: "Vital Seed Giving - Sound & Healing Partner offering",
            },
          },
        },
      ],
      success_url: `${appUrl}/dashboard/vital-seed?success=true`,
      cancel_url: `${appUrl}/dashboard/vital-seed?canceled=true`,
    });

    const supabase = getSupabaseAdmin();
    const { error: insertError } = await supabase.from("donations").insert({
      email: customerEmail,
      amount_cents: amountInCents,
      status: "pending",
      stripe_session_id: session.id,
    });

    if (insertError) {
      console.error("Failed to stage donation record:", insertError.message);
      return NextResponse.json(
        { error: "Unable to initialize donation record." },
        { status: 500 },
      );
    }

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("CRITICAL CHECKOUT ERROR TRACE:", error);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
