"use client";

import ExperienceDashboardInterfaceLayer from "@/components/experience/dashboard/ExperienceDashboardInterfaceLayer";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type ExperienceDashboardContentProps = {
  headerDisplayName: string;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardContent({
  headerDisplayName,
  initialCountdownConfig,
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardInterfaceLayer
      headerDisplayName={headerDisplayName}
      initialCountdownConfig={initialCountdownConfig}
    />
  );
}
