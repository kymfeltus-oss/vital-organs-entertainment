"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Play } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  canAccessVodAsset,
  normalizeSubscriptionTier,
  requiredTierLabel,
  VOD_CATALOG,
  VOD_CATEGORIES,
  type VodCatalogItem,
  type VodCategoryId,
} from "@/lib/features/browse/vod-catalog";
import type { SubscriptionTier } from "@/lib/admin/tiers";

function resolveTenantTier(): SubscriptionTier {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_TIER?.trim().toLowerCase();
  return normalizeSubscriptionTier(fromEnv);
}

export default function VodBrowseClient() {
  const { theme } = useTheme();
  const tenantTier = resolveTenantTier();
  const accent = theme.colors.primary || "#00C2FF";

  const [activeCategory, setActiveCategory] = useState<VodCategoryId>("all");
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    if (activeCategory === "all") return VOD_CATALOG;
    return VOD_CATALOG.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const handleCardPress = (item: VodCatalogItem) => {
    if (canAccessVodAsset(tenantTier, item.requiredTier)) {
      setLockedNotice(null);
      return;
    }

    setLockedNotice(
      `${item.title} requires ${requiredTierLabel(item.requiredTier)} access. Upgrade your network pass to unlock this asset.`,
    );
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black pb-6 text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70"
        style={{
          background: `radial-gradient(circle at 20% 0%, ${accent}22, transparent 55%), radial-gradient(circle at 80% 10%, #6C4DFF18, transparent 45%)`,
        }}
      />

      <div className="relative z-10 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          On-Demand Media Matrix
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-4xl">Browse Catalog</h1>
        <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-neutral-400">
          Stream archived broadcasts, backstage sessions, and premium enterprise exclusives from your
          network library.
        </p>
      </div>

      <div className="relative z-10 mb-5 overflow-x-auto px-4 md:px-8">
        <div className="flex min-w-max gap-2 pb-1">
          {VOD_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
                style={
                  isActive
                    ? {
                        borderColor: `${accent}88`,
                        backgroundColor: `${accent}18`,
                        color: accent,
                      }
                    : {
                        borderColor: "#262626",
                        backgroundColor: "#0a0a0a",
                        color: "#a3a3a3",
                      }
                }
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {lockedNotice ? (
        <div className="relative z-10 mx-4 mb-4 rounded-2xl border border-[#FF0F8E]/35 bg-[#FF0F8E]/10 px-4 py-3 text-xs leading-relaxed text-[#ffb8e8] md:mx-8">
          {lockedNotice}{" "}
          <Link href="/contact-us?intent=enterprise" className="font-semibold underline">
            Request upgrade pass
          </Link>
        </div>
      ) : null}

      <div className="relative z-10 grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-4 md:px-8 lg:grid-cols-4">
        {filteredCatalog.map((item) => {
          const unlocked = canAccessVodAsset(tenantTier, item.requiredTier);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCardPress(item)}
              className="group relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 text-left transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div
                className="relative aspect-[2/3] w-full"
                style={{
                  background: `linear-gradient(160deg, ${item.posterFrom}, ${item.posterTo})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {item.isLive ? (
                  <span
                    className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-black"
                    style={{ backgroundColor: accent }}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-black/70" />
                    Live Replay
                  </span>
                ) : null}

                <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-200">
                  {item.runtime}
                </span>

                {!unlocked ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-[2px]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50">
                      <Lock className="size-5 text-white" aria-hidden="true" />
                    </div>
                    <span className="px-3 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-300">
                      {requiredTierLabel(item.requiredTier)} Required
                    </span>
                  </div>
                ) : (
                  <div
                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      backgroundColor: accent,
                      boxShadow: `0 0 18px ${accent}88`,
                    }}
                  >
                    <Play className="size-4 fill-black text-black" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="space-y-1 p-3">
                <h2 className="line-clamp-2 text-sm font-bold tracking-tight text-white">{item.title}</h2>
                <p className="line-clamp-1 text-[11px] text-neutral-400">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
