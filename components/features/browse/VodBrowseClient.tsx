"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  buildBrowseCategories,
  canAccessVodAsset,
  lockedTierLabel,
  normalizeSubscriptionTier,
  requiredTierLabel,
  type BrowseCatalogItem,
} from "@/lib/features/browse/vod-catalog";
import type { SubscriptionTier } from "@/lib/admin/tiers";

type VodBrowseClientProps = {
  catalog: readonly BrowseCatalogItem[];
};

function resolveTenantTier(): SubscriptionTier {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_TIER?.trim().toLowerCase();
  return normalizeSubscriptionTier(fromEnv);
}

export default function VodBrowseClient({ catalog }: VodBrowseClientProps) {
  const { theme } = useTheme();
  const tenantTier = resolveTenantTier();
  const primaryColor = theme.colors.primary || "#00C2FF";

  const categories = useMemo(() => buildBrowseCategories(catalog), [catalog]);
  const [activeCategory, setActiveCategory] = useState("All Media");
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    if (activeCategory === "All Media") return catalog;
    return catalog.filter((item) => item.category === activeCategory);
  }, [activeCategory, catalog]);

  const handleCardPress = (item: BrowseCatalogItem) => {
    if (canAccessVodAsset(tenantTier, item.tierRequired)) {
      setLockedNotice(null);
      return;
    }

    setLockedNotice(
      `${item.title} requires ${requiredTierLabel(item.tierRequired)} access. Upgrade your network pass to unlock this asset.`,
    );
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black pb-8 text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-70"
        style={{
          background: `radial-gradient(circle at 20% 0%, ${primaryColor}22, transparent 55%), radial-gradient(circle at 80% 10%, #6C4DFF18, transparent 45%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 border-b border-neutral-900/60 px-8 pb-6 pt-12 md:flex-row md:items-center">
        <div>
          <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.4em] text-[#00C2FF]">
            04 // ON-DEMΛND MEDIΛ MΛTRIX
          </span>
          <h1 className="select-none text-3xl font-light uppercase tracking-[0.2em] text-white">
            P<span className="inline-block scale-x-[1.15] font-extralight text-neutral-400">Λ</span>R
            <span className="inline-block scale-x-[1.15] font-extralight text-neutral-400">Λ</span>BLE
            CATALOG
          </h1>
          <p className="mt-2 max-w-xl text-xs font-light leading-relaxed text-neutral-400">
            Stream flagship platform keynotes, infrastructure telemetry documentations, and
            architectural system tutorials directly from the core broadcast archive nodes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-neutral-900 bg-neutral-950 px-4 py-2 font-mono text-xs">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_10px_#00C2FF]" />
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">
            System Pipeline Secure
          </span>
        </div>
      </div>

      <div className="relative z-10 mb-5 mt-6 overflow-x-auto px-4 md:px-8">
        <div className="mx-auto flex min-w-max max-w-7xl gap-2 pb-1">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
                style={
                  isActive
                    ? {
                        borderColor: `${primaryColor}88`,
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                      }
                    : {
                        borderColor: "#262626",
                        backgroundColor: "#0a0a0a",
                        color: "#a3a3a3",
                      }
                }
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {lockedNotice ? (
        <div className="relative z-10 mx-auto mb-4 max-w-7xl rounded-2xl border border-[#FF0F8E]/35 bg-[#FF0F8E]/10 px-4 py-3 text-xs leading-relaxed text-[#ffb8e8] md:mx-8">
          {lockedNotice}{" "}
          <Link href="/contact-us?intent=enterprise" className="font-semibold underline">
            Request upgrade pass
          </Link>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
        {filteredCatalog.map((item) => {
          const passesSecurityGate = canAccessVodAsset(tenantTier, item.tierRequired);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCardPress(item)}
              className="group relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 text-left transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="relative aspect-video w-full overflow-hidden border-b border-neutral-900/60 bg-gradient-to-br from-neutral-950 via-[#050816] to-black">
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0c0e1a_1px,transparent_1px),linear-gradient(to_bottom,#0c0e1a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-40 mix-blend-overlay" />

                <div
                  className="pointer-events-none absolute -bottom-10 -right-10 z-0 h-32 w-32 rounded-full opacity-10 blur-[40px]"
                  style={{ backgroundColor: primaryColor }}
                />

                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 z-10 h-full w-full object-cover opacity-30 transition-opacity duration-500 group-hover:opacity-40"
                  />
                ) : null}

                <span className="absolute left-3 top-3 z-20 rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-neutral-200">
                  {item.category}
                </span>

                {!passesSecurityGate ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 p-4 text-center backdrop-blur-[2px]">
                    <div
                      className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 text-xs font-mono shadow-lg"
                      style={{ color: primaryColor }}
                    >
                      🔒
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                      {lockedTierLabel(item.tierRequired)}
                    </p>
                    <p className="mt-1 max-w-[220px] text-[9px] font-light leading-relaxed text-neutral-500">
                      Upgrade your network configuration subscription clearance level to unlock
                      access.
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div
                      className="flex h-11 w-11 translate-y-1 items-center justify-center rounded-full text-xs font-bold text-black shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 group-hover:translate-y-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ▶
                    </div>
                  </div>
                )}

                <span className="absolute bottom-3 right-3 z-20 rounded border border-neutral-900 bg-neutral-950/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                  {item.duration}
                </span>
              </div>

              <div className="space-y-1 p-4">
                <h2 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-white">
                  {item.title}
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  {item.views}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
