import type Stripe from "stripe";
import type { SubscriptionTier } from "@/lib/admin/tiers";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function resolveTierFromPriceId(priceId: string | undefined): SubscriptionTier {
  if (!priceId) return "starter";

  const enterprisePriceIds = [
    process.env.STRIPE_PRICE_ID_ENTERPRISE,
    process.env.STRIPE_PRICE_PLATFORM_ENTERPRISE,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  const proPriceIds = [
    process.env.STRIPE_PRICE_ID_PRO,
    process.env.STRIPE_PRICE_PLATFORM_PRO,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  const starterPriceIds = [
    process.env.STRIPE_PRICE_ID_STARTER,
    process.env.STRIPE_PRICE_PLATFORM_STARTER,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (enterprisePriceIds.includes(priceId)) return "enterprise";
  if (proPriceIds.includes(priceId)) return "pro";
  if (starterPriceIds.includes(priceId)) return "starter";
  return "starter";
}

function resolveTierFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  priceId: string | undefined,
): SubscriptionTier {
  const metadataTier = metadata?.platform_tier?.trim().toLowerCase();
  if (metadataTier === "pro" || metadataTier === "enterprise" || metadataTier === "starter") {
    return metadataTier;
  }

  return resolveTierFromPriceId(priceId);
}

/** Updates `tenant_themes.tier` from Stripe subscription metadata — no payment capture side effects. */
export async function syncTenantTierFromSubscription(
  subscription: Stripe.Subscription,
  options?: { forceTier?: SubscriptionTier },
): Promise<{ updated: boolean; tenantId?: string; tier?: SubscriptionTier }> {
  const tenantId = subscription.metadata?.tenant_id?.trim();
  if (!tenantId) return { updated: false };

  const stripePriceId = subscription.items.data[0]?.price?.id;
  const mappedTier = options?.forceTier ?? resolveTierFromMetadata(subscription.metadata, stripePriceId);

  const { error } = await getSupabaseAdmin()
    .from("tenant_themes")
    .update({ tier: mappedTier })
    .eq("tenant_id", tenantId);

  if (error) throw error;

  return { updated: true, tenantId, tier: mappedTier };
}
