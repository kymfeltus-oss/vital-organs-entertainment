"use client";

import { usePathname } from "next/navigation";
import AttendeeLiveNavLink from "@/components/navigation/AttendeeLiveNavLink";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  BOTTOM_NAV_HOTSPOTS,
  type BottomNavItemId,
} from "@/lib/navigation/bottom-nav-config";
import Link from "next/link";
import { HeartHandshake, Home, Music2, Radio, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BOTTOM_NAV_ICONS: Record<BottomNavItemId, LucideIcon> = {
  home: Home,
  live: Radio,
  giving: HeartHandshake,
  music: Music2,
  "buy-seeds": Sprout,
};

const FEATURE_GATE: Record<BottomNavItemId, keyof import("@/lib/theme/types").ThemeFeatureFlags | null> = {
  home: null,
  live: "showLive",
  giving: "showGiving",
  music: "showMusic",
  "buy-seeds": "showBuySeeds",
};

export default function BottomNavigation() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const visibleItems = BOTTOM_NAV_HOTSPOTS.filter((item) => {
    const gate = FEATURE_GATE[item.id];
    if (!gate) return true;
    return theme.features[gate];
  });

  return (
    <nav
      aria-label="Primary"
      className="generic-bottom-nav"
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "color-mix(in srgb, var(--theme-surface) 92%, transparent)",
      }}
    >
      <div className="generic-bottom-nav__items">
        {visibleItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = BOTTOM_NAV_ICONS[item.id];
          const className = `generic-bottom-nav__item touch-target${active ? " generic-bottom-nav__item--active" : ""}`;
          const content = (
            <>
              <Icon className="generic-bottom-nav__icon" strokeWidth={2.25} aria-hidden="true" />
              <span className="generic-bottom-nav__label">{item.label}</span>
            </>
          );

          if (item.id === "live") {
            return (
              <AttendeeLiveNavLink
                key={item.id}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {content}
              </AttendeeLiveNavLink>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
