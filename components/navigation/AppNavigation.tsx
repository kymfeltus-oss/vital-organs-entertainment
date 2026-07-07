"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AttendeeLiveNavLink from "@/components/navigation/AttendeeLiveNavLink";
import { verifyFeatureAccess, type SubscriptionTier } from "@/lib/admin/tiers";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

export interface AppNavigationProps {
  tenantTier: SubscriptionTier;
  featureVisibility: {
    showLiveStage: boolean;
    showOnDemandCatalog: boolean;
    showTokenShop: boolean;
    showInteractionPanel: boolean;
  };
}

type NavTab = {
  label: string;
  path: string;
  visible: boolean;
  useLiveNavLink?: boolean;
};

export default function AppNavigation({ tenantTier, featureVisibility }: AppNavigationProps) {
  const pathname = usePathname();

  const navigationGrid: NavTab[] = [
    {
      label: "Hub",
      path: ATTENDEE_DASHBOARD_PATH,
      visible: true,
    },
    {
      label: "Browse",
      path: "/browse",
      visible: featureVisibility.showOnDemandCatalog,
    },
    {
      label: "Live Stage",
      path: "/live",
      visible: featureVisibility.showLiveStage,
      useLiveNavLink: true,
    },
    {
      label: "Token Shop",
      path: "/buy-seeds",
      visible:
        featureVisibility.showTokenShop &&
        Boolean(verifyFeatureAccess(tenantTier, "allowVirtualGifting")),
    },
    {
      label: "Backstage Passes",
      path: "/exclusive",
      visible: tenantTier !== "starter",
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-neutral-900 bg-neutral-950 px-4 pb-[env(safe-area-inset-bottom)]"
    >
      {navigationGrid.map((tab) => {
        if (!tab.visible) return null;
        const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
        const className = `flex flex-col items-center justify-center text-[11px] font-medium tracking-tight transition-colors ${
          isActive ? "text-[#00f2ff]" : "text-neutral-500 hover:text-neutral-300"
        }`;

        if (tab.useLiveNavLink) {
          return (
            <AttendeeLiveNavLink
              key={tab.path}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={className}
            >
              <span>{tab.label}</span>
            </AttendeeLiveNavLink>
          );
        }

        return (
          <Link
            key={tab.path}
            href={tab.path}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={className}
          >
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
