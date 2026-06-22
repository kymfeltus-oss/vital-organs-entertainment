"use client";

import ExperienceDashboardInterfaceLayer from "@/components/experience/dashboard/ExperienceDashboardInterfaceLayer";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";

type ExperienceDashboardContentProps = {
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
};

export default function ExperienceDashboardContent({
  initialCountdownConfig,
  initialCountdown,
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardInterfaceLayer
      initialCountdownConfig={initialCountdownConfig}
      initialCountdown={initialCountdown}
    />
  );
}
