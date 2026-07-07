"use client";

import GenericDashboardView from "@/components/experience/dashboard/GenericDashboardView";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardMobileViewProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
};

export default function ExperienceDashboardMobileView(props: ExperienceDashboardMobileViewProps) {
  return <GenericDashboardView {...props} />;
}
