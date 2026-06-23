import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getSeedBillingPackage,
  resolveSeedStripePriceId,
  seedBillingPriceCents,
} from "@/lib/billing-config";
import {
  getAppUrl,
  getStripeSecretKey,
  resolveAuthenticatedBuyer,
} from "@/lib/checkout/server";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SeedCheckoutBody = {
  packageId?: string;
};

/**
 * Vital Seed bundle checkout via pre-configured Stripe Price IDs.
 *
 * Security model matches `/api/checkout/merch`:
 * - Buyer identity from verified Supabase session cookies only.
 * - Request body accepts `packageId` alone — never email or user_id.
 * - Stripe session metadata stamped server-side for webhook fulfillment.
 */
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
      return NextResponse.json(
        { error: "A seed package selection is required." },
        { status: 400 },
      );
    }

    const targetPack = getSeedBillingPackage(packageId);

    if (!targetPack) {
      return NextResponse.json(
        { error: "Invalid seed bundle package selection." },
        { status: 400 },
      );
    }

    const stripePriceId = resolveSeedStripePriceId(targetPack);

    if (!stripePriceId) {
      console.error(
        `Missing Stripe Price ID for ${targetPack.id} (${targetPack.stripePriceEnv}).`,
      );
      return NextResponse.json(
        { error: "This seed package is not available for checkout yet." },
        { status: 503 },
      );
    }

    const appUrl = getAppUrl(request);
    const stripe = new Stripe(stripeSecretKey);
    const amountCents = seedBillingPriceCents(targetPack);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: buyer.userId,
      customer_email: buyer.email,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: {
        checkout_type: "seed_pack",
        package_id: targetPack.id,
        product_id: targetPack.productType,
        product_type: targetPack.productType,
        seed_count: String(targetPack.count),
        user_id: buyer.userId,
        email: buyer.email,
      },
      success_url: `${appUrl}${EXPERIENCE_LIVE_PATH}?payment=success`,
      cancel_url: `${appUrl}${EXPERIENCE_LIVE_PATH}?payment=cancelled`,
    });

    const supabase = getSupabaseAdmin();
    const { error: insertError } = await supabase.from("orders").insert({
      user_id: buyer.userId,
      email: buyer.email,
      product_type: targetPack.productType,
      amount_total: amountCents,
      status: "pending",
      stripe_session_id: session.id,
    });

    if (insertError) {
      console.error("Failed to stage seed order record:", insertError.message);
      return NextResponse.json(
        { error: "Unable to initialize order record." },
        { status: 500 },
      );
    }

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create checkout session." },
        { status: 500 },
      );
    }

    return withSessionCookies(NextResponse.json({ url: session.url }));
  } catch (error) {
    console.error("Seed billing checkout session error:", error);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
