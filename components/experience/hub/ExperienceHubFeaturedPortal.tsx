"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play, Radio } from "lucide-react";
import type { ExperienceHubPortalTab } from "@/lib/experience/hub-content";
import { HUB_SPEC_COLORS, HUB_SPEC_GLOWS, hubSpecClasses } from "@/lib/experience/hub-design-tokens";

type ExperienceHubFeaturedPortalProps = {
  portalTabs: ExperienceHubPortalTab[];
};

export default function ExperienceHubFeaturedPortal({
  portalTabs,
}: ExperienceHubFeaturedPortalProps) {
  const [activeTabId, setActiveTabId] = useState(portalTabs[0]?.id ?? "");

  useEffect(() => {
    if (!portalTabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(portalTabs[0]?.id ?? "");
    }
  }, [activeTabId, portalTabs]);

  const activeTab = useMemo(
    () => portalTabs.find((tab) => tab.id === activeTabId) ?? portalTabs[0],
    [activeTabId, portalTabs],
  );

  if (!activeTab) return null;

  return (
    <article
      className={`${hubSpecClasses.glassPortal} relative mx-auto mt-[clamp(1rem,3vw,1.75rem)] w-full max-w-[min(100%,56rem)] overflow-hidden rounded-[1.35rem] border border-[#FF007F]/30 shadow-[0_0_40px_rgba(255,0,127,0.25)] backdrop-blur-xl`}
    >
      {portalTabs.length > 1 ? (
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3 md:px-6">
          {portalTabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`min-h-9 rounded-full px-3 py-1.5 ${hubSpecClasses.label} transition ${
                  isActive
                    ? "bg-[#FF007F22] text-[#FF007F]"
                    : "text-brand-muted hover:text-white"
                }`}
                style={isActive ? { boxShadow: HUB_SPEC_GLOWS.pink } : undefined}
              >
                {tab.categoryLabel}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between gap-5 p-5 md:p-6">
          <div>
            <p
              className={`${hubSpecClasses.label} text-[0.58rem] tracking-[0.24em]`}
              style={{ color: HUB_SPEC_COLORS.pink }}
            >
              {activeTab.categoryLabel}
            </p>
            <h2
              className={`${hubSpecClasses.headline} mt-3 text-[clamp(1.15rem,4.5vw,1.65rem)] leading-tight tracking-[0.08em]`}
            >
              {activeTab.title}
            </h2>
            <p className={`${hubSpecClasses.body} mt-3 text-sm leading-relaxed`}>
              {activeTab.body}
            </p>
          </div>

          <Link
            href={activeTab.ctaHref}
            className={`inline-flex min-h-11 w-fit items-center gap-3 rounded-full border px-4 py-2 ${hubSpecClasses.label} text-[0.62rem] tracking-[0.16em] transition hover:bg-[#00E6FF15]`}
            style={{
              borderColor: `${HUB_SPEC_COLORS.cyan}88`,
              color: HUB_SPEC_COLORS.cyan,
              boxShadow: HUB_SPEC_GLOWS.cyan,
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border bg-brand-black/40"
              style={{ borderColor: `${HUB_SPEC_COLORS.cyan}66` }}
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            </span>
            {activeTab.ctaLabel}
          </Link>
        </div>

        <div className="relative flex min-h-[220px] items-center justify-center bg-brand-panel/55 p-5 md:min-h-[280px] md:rounded-r-xl">
          <div
            className="absolute right-4 top-4 flex items-center gap-2 rounded-full border bg-brand-black/55 px-2.5 py-1 backdrop-blur-md"
            style={{ borderColor: `${HUB_SPEC_COLORS.pink}66`, boxShadow: HUB_SPEC_GLOWS.pink }}
          >
            <Radio
              className="h-3.5 w-3.5"
              style={{ color: HUB_SPEC_COLORS.pink }}
              aria-hidden="true"
            />
            <span className={`${hubSpecClasses.label} text-[0.58rem] tracking-[0.12em] text-white`}>
              {activeTab.durationLabel}
            </span>
          </div>

          <Link
            href={activeTab.ctaHref}
            className="flex h-16 w-16 items-center justify-center rounded-full border bg-brand-black/50 text-white backdrop-blur-sm transition hover:scale-105"
            style={{
              borderColor: `${HUB_SPEC_COLORS.neonPink}88`,
              boxShadow: HUB_SPEC_GLOWS.neonPink,
            }}
            aria-label={activeTab.ctaLabel}
          >
            <Play className="h-7 w-7 fill-current" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
