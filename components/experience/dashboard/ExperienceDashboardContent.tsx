"use client";

import ExperienceDashboardInterfaceLayer from "@/components/experience/dashboard/ExperienceDashboardInterfaceLayer";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type ExperienceDashboardContentProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardContent({
  initialCountdownConfig,
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardInterfaceLayer initialCountdownConfig={initialCountdownConfig} />
  );
}
