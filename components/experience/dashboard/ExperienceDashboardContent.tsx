"use client";

import ExperienceDashboardHero from "@/components/experience/dashboard/ExperienceDashboardHero";
import { HERO_STACK_LAYOUT_VERSION } from "@/lib/experience/dashboard-beam-position";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardContentProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardContent({
  profile,
  onProfileChange,
  initialCountdownConfig,
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardHero
      key={`mobile-hero-v${HERO_STACK_LAYOUT_VERSION}`}
      profile={profile}
      initialCountdownConfig={initialCountdownConfig}
    />
  );
}
