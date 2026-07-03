import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { parseSeedPackCheckoutCount } from "@/lib/billing-config";
import {
  getStripeSecretKey,
  resolveAuthenticatedBuyer,
} from "@/lib/checkout/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type ConfirmSeedCheckoutBody = {
  sessionId?: unknown;
};

/**
 * Success-return fallback for Stripe Checkout.
 * Stripe remains authoritative: a query-string flag alone can never credit seeds.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedBuyer(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const stripeSecretKey = getStripeSecretKey();
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment processing is not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as ConfirmSeedCheckoutBody;
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: "A valid Checkout Session is required." },
        { status: 400 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadataUserId = session.metadata?.user_id?.trim() ?? null;
    const checkoutUserId = session.client_reference_id?.trim() ?? null;

    if (
      checkoutUserId !== auth.buyer.userId ||
      (metadataUserId && metadataUserId !== auth.buyer.userId)
    ) {
      return auth.withSessionCookies(
        NextResponse.json({ error: "Checkout identity mismatch." }, { status: 403 }),
      );
    }

    if (
      session.status !== "complete" ||
      session.payment_status !== "paid" ||
      session.metadata?.checkout_type !== "seed_pack"
    ) {
      return auth.withSessionCookies(
        NextResponse.json(
          { error: "Stripe has not confirmed this seed payment." },
          { status: 409 },
        ),
      );
    }

    const userEmail =
      session.metadata?.email?.trim().toLowerCase() ||
      session.customer_details?.email?.trim().toLowerCase() ||
      auth.buyer.email;
    const productId =
      session.metadata?.product_id?.trim() ??
      session.metadata?.product_type?.trim() ??
      null;
    const seedCount = parseSeedPackCheckoutCount(session.metadata ?? undefined);
    const amountTotal = session.amount_total ?? 0;

    if (!productId || seedCount <= 0 || amountTotal <= 0) {
      return auth.withSessionCookies(
        NextResponse.json(
          { error: "Checkout seed metadata is incomplete." },
          { status: 422 },
        ),
      );
    }

    const { data, error } = await getSupabaseAdmin().rpc(
      "fulfill_seed_pack_checkout",
      {
        p_stripe_session_id: session.id,
        p_user_id: auth.buyer.userId,
        p_email: userEmail,
        p_product_id: productId,
        p_amount_total: amountTotal,
        p_seed_count: seedCount,
      },
    );

    if (error) {
      console.error("Seed checkout confirmation failed:", error);
      return auth.withSessionCookies(
        NextResponse.json(
          { error: "Payment was verified, but seed crediting is still processing." },
          { status: 500 },
        ),
      );
    }

    const fulfillment = data as {
      seed_balance?: number;
      seeds_credited?: number;
    } | null;

    return auth.withSessionCookies(
      NextResponse.json({
        success: true,
        balance: fulfillment?.seed_balance ?? 0,
        seedsCredited: fulfillment?.seeds_credited ?? 0,
      }),
    );
  } catch (error) {
    console.error("Seed checkout confirmation route error:", error);
    return NextResponse.json(
      { error: "Unable to confirm the completed seed payment." },
      { status: 500 },
    );
  }
}
