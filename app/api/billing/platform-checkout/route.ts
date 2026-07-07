import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import type { AdminTierId } from "@/lib/admin/types";
import {
  PLATFORM_SAAS_TIERS,
  resolvePlatformStripePriceId,
} from "@/lib/platform/saas-tiers";
import { formatStripeCheckoutError, getStripeSecretKey } from "@/lib/checkout/server";
import { getMarketingPlatformBaseUrl } from "@/lib/theme/platform-domains";

type PlatformCheckoutBody = {
  tier?: string;
  tenantId?: string;
  subdomain?: string;
  targetSubdomainSlug?: string;
};

const ALLOWED_TIERS = new Set(PLATFORM_SAAS_TIERS.map((tier) => tier.id));

function isAllowedTier(value: string): value is AdminTierId {
  return ALLOWED_TIERS.has(value as AdminTierId);
}

function normalizeTenantSlug(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

/** Stripe Checkout for B2B platform subscription tiers (apex domain only). */
export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = getStripeSecretKey();
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment processing is not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as PlatformCheckoutBody;
    const tierId = body.tier?.trim().toLowerCase() ?? "";
    const targetSubdomainSlug = normalizeTenantSlug(
      body.tenantId ?? body.subdomain ?? body.targetSubdomainSlug,
    );

    if (!tierId || !isAllowedTier(tierId)) {
      return NextResponse.json({ error: "A valid subscription tier is required." }, { status: 400 });
    }

    if (!targetSubdomainSlug) {
      return NextResponse.json(
        { error: "A tenant subdomain is required before checkout can start." },
        { status: 400 },
      );
    }

    const tier = PLATFORM_SAAS_TIERS.find((entry) => entry.id === tierId);
    if (!tier || tier.contactSales) {
      return NextResponse.json(
        { error: "Enterprise plans require a sales conversation." },
        { status: 400 },
      );
    }

    const priceId = resolvePlatformStripePriceId(tierId);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price is not configured for the ${tier.name} tier.`,
        },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const marketingBaseUrl = getMarketingPlatformBaseUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${marketingBaseUrl}/admin/networks?success=true`,
      cancel_url: `${marketingBaseUrl}/onboarding?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        checkout_type: "platform_subscription",
        platform_tier: tierId,
        tenant_id: targetSubdomainSlug,
      },
      subscription_data: {
        metadata: {
          platform_tier: tierId,
          tenant_id: targetSubdomainSlug,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[billing/platform-checkout] failed:", error);
    return NextResponse.json(
      { error: formatStripeCheckoutError(error) },
      { status: 500 },
    );
  }
}
