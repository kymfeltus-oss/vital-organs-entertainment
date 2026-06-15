"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import ExperienceDashboardContent from "@/components/experience/dashboard/ExperienceDashboardContent";
import ExperienceDashboardMobileFixedChrome from "@/components/experience/dashboard/ExperienceDashboardMobileFixedChrome";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardMobileViewProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
};

export default function ExperienceDashboardMobileView({
  profile,
  onProfileChange,
}: ExperienceDashboardMobileViewProps) {
  return (
    <div
      data-dashboard-shell="mobile"
      className="relative flex h-dvh max-h-dvh min-h-0 w-full max-w-[100vw] flex-col overflow-hidden overscroll-none bg-brand-black md:hidden"
    >
      <ExperienceDashboardBackdrop variant="mobile" />

      <ExperienceDashboardMobileFixedChrome
        profile={profile}
        onProfileChange={onProfileChange}
      />

      <div
        data-dashboard-layer="mobile"
        className="relative z-10 h-full min-h-0 flex-1 overflow-hidden overscroll-none"
      >
        <ExperienceDashboardContent
          profile={profile}
          onProfileChange={onProfileChange}
          variant="mobile"
        />
      </div>
    </div>
  );
}
