"use client";

// @refresh reset
import ExperienceDashboardHero from "@/components/experience/dashboard/ExperienceDashboardHero";
import { HERO_STACK_LAYOUT_VERSION } from "@/lib/experience/dashboard-beam-position";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardContentProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  variant?: "mobile" | "desktop";
};

export default function ExperienceDashboardContent({
  profile,
  onProfileChange,
  variant = "desktop",
}: ExperienceDashboardContentProps) {
  return (
    <ExperienceDashboardHero
      key={`${variant}-hero-v${HERO_STACK_LAYOUT_VERSION}`}
      profile={profile}
      onProfileChange={onProfileChange}
      variant={variant}
    />
  );
}
