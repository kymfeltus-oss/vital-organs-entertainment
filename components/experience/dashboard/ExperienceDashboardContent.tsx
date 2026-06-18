"use client";

import ExperienceDashboardHero from "@/components/experience/dashboard/ExperienceDashboardHero";
import { HERO_STACK_LAYOUT_VERSION } from "@/lib/experience/dashboard-beam-position";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type ExperienceDashboardContentProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardContent({
  initialCountdownConfig,
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardHero
      key={`mobile-hero-v${HERO_STACK_LAYOUT_VERSION}`}
      initialCountdownConfig={initialCountdownConfig}
    />
  );
}
