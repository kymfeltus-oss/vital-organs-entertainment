"use client";

import AppNavigation from "@/components/navigation/AppNavigation";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { SubscriptionTier } from "@/lib/admin/tiers";

function resolveTenantTier(): SubscriptionTier {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_TIER?.trim().toLowerCase();
  if (fromEnv === "pro" || fromEnv === "enterprise") return fromEnv;
  return "starter";
}

export default function BottomNavigation() {
  const { theme } = useTheme();

  return (
    <AppNavigation
      tenantTier={resolveTenantTier()}
      featureVisibility={{
        showLiveStage: theme.features.showLive,
        showOnDemandCatalog: theme.features.showMusic,
        showTokenShop: theme.features.showBuySeeds,
        showInteractionPanel: theme.features.showPrayer,
      }}
    />
  );
}
