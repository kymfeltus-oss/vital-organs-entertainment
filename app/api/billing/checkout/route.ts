import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getSeedBillingPackage,
  resolveSeedStripePriceId,
  seedBillingPriceCents,
} from "@/lib/billing-config";
import {
  formatStripeCheckoutError,
  getAppUrl,
  getStripeSecretKey,
  resolveAuthenticatedBuyer,
} from "@/lib/checkout/server";
import { stagePendingCheckoutOrder } from "@/lib/checkout/stage-pending-order";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SeedCheckoutBody = {
  packageId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = getStripeSecretKey();

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment processing is not configured." },
        { status: 500 },
      );
    }

    const auth = await resolveAuthenticatedBuyer(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { buyer, withSessionCookies } = auth;
    const body = (await request.json()) as SeedCheckoutBody;
    const packageId = body.packageId?.trim();

    if (!packageId) {
      return NextResponse.json({ error: "Seed package is required." }, { status: 400 });
    }

    const seedPackage = getSeedBillingPackage(packageId);

    if (!seedPackage) {
      return NextResponse.json({ error: "Invalid seed package." }, { status: 400 });
    }

    const appUrl = getAppUrl(request);
    const stripe = new Stripe(stripeSecretKey);
    const priceId = resolveSeedStripePriceId(seedPackage);
    const amountCents = seedBillingPriceCents(seedPackage);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "link"],
      client_reference_id: buyer.userId,
      customer_email: buyer.email,
      line_items: [
        priceId
          ? {
              price: priceId,
              quantity: 1,
            }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: amountCents,
                product_data: {
                  name: `${seedPackage.count.toLocaleString("en-US")} Vital Seeds`,
                  description: "Vital Seeds for live-room stage interactions.",
                },
              },
            },
      ],
      metadata: {
        checkout_type: "seed_pack",
        package_id: seedPackage.id,
        product_id: seedPackage.productType,
        product_type: seedPackage.productType,
        seed_count: String(seedPackage.count),
        user_id: buyer.userId,
        email: buyer.email,
      },
      success_url: `${appUrl}/buy-seeds?success=true`,
      cancel_url: `${appUrl}/buy-seeds?canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create checkout session." },
        { status: 500 },
      );
    }

    const supabase = getSupabaseAdmin();
    const stagedOrder = await stagePendingCheckoutOrder(supabase, {
      userId: buyer.userId,
      email: buyer.email,
      productType: seedPackage.productType,
      amountTotalCents: amountCents,
      stripeSessionId: session.id,
    });

    if (!stagedOrder.ok) {
      console.error("Failed to stage seed order:", stagedOrder.errorMessage);
      return NextResponse.json(
        { error: "Unable to initialize seed order." },
        { status: 500 },
      );
    }

    return withSessionCookies(NextResponse.json({ url: session.url }));
  } catch (error) {
    console.error("Seed checkout session error:", error);
    return NextResponse.json(
      { error: formatStripeCheckoutError(error) },
      { status: 500 },
    );
  }
}
