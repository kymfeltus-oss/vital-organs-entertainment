"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import ExperienceDashboardContent from "@/components/experience/dashboard/ExperienceDashboardContent";
import ExperienceDashboardMobileFixedChrome from "@/components/experience/dashboard/ExperienceDashboardMobileFixedChrome";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardMobileViewProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardMobileView({
  profile,
  onProfileChange,
  initialCountdownConfig,
}: ExperienceDashboardMobileViewProps) {
  return (
    <div
      data-dashboard-shell="mobile"
      className="relative flex h-dvh max-h-dvh min-h-0 w-full max-w-[100vw] flex-col overflow-hidden overscroll-none bg-brand-black"
    >
      <ExperienceDashboardBackdrop />

      <ExperienceDashboardMobileFixedChrome
        profile={profile}
        onProfileChange={onProfileChange}
      />

      <div
        data-dashboard-layer="mobile"
        className="relative z-10 h-full min-h-0 flex-1 overflow-hidden overscroll-none"
      >
        <ExperienceDashboardContent initialCountdownConfig={initialCountdownConfig} />
      </div>
    </div>
  );
}
