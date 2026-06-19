"use client";

import ExperienceDashboardInterfaceLayer from "@/components/experience/dashboard/ExperienceDashboardInterfaceLayer";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type ExperienceDashboardContentProps = {
  profile: AttendeeProfileSnapshot;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardContent({
  profile,
  initialCountdownConfig,
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardInterfaceLayer
      profile={profile}
      initialCountdownConfig={initialCountdownConfig}
    />
  );
}
