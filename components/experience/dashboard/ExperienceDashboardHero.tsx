"use client";

import Link from "next/link";
import { useRef } from "react";
import ExperienceDashboardCardRow from "@/components/experience/dashboard/ExperienceDashboardCardRow";
import ExperienceDashboardMobileHeroLayout from "@/components/experience/dashboard/ExperienceDashboardMobileHeroLayout";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";

export default function ExperienceDashboardHero() {
  const headlineBlockRef = useRef<HTMLDivElement>(null);

  return (
    <section
      className="dashboard-hero dashboard-hero--mobile relative z-10 mx-auto h-full w-full bg-transparent"
      aria-label="Experience dashboard hero"
    >
      <ExperienceDashboardMobileHeroLayout headlineBlockRef={headlineBlockRef} />

      <div
        ref={headlineBlockRef}
        className="dashboard-hero-headline-block dashboard-hero-headline-block--mobile-fixed pointer-events-none text-center"
      >
        <div className="dashboard-hero-copy-stack pointer-events-auto flex flex-col items-center gap-2">
          <div className="dashboard-hero-cta-images mx-auto flex w-full flex-row items-center justify-center gap-2 px-2">
            <Link
              href={AWAKENING_ASSETS.routes.enterExperience}
              className="dashboard-hero-cta-hit touch-target"
              aria-label="Enter Experience"
            />
            <Link
              href={AWAKENING_ASSETS.routes.watchStory}
              className="dashboard-hero-cta-hit touch-target"
              aria-label="Watch Story"
            />
          </div>

          <ExperienceDashboardCardRow />
        </div>
      </div>
    </section>
  );
}
