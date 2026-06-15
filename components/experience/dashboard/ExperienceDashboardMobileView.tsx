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
      className="relative flex h-dvh min-h-dvh w-full max-w-[100vw] flex-col overflow-hidden bg-brand-black md:hidden"
    >
      <ExperienceDashboardBackdrop variant="mobile" />

      <ExperienceDashboardMobileFixedChrome
        profile={profile}
        onProfileChange={onProfileChange}
      />

      <div
        data-dashboard-scroll="mobile"
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-safe"
      >
        <div className="relative min-h-dvh w-full flex-1">
          <ExperienceDashboardContent
            profile={profile}
            onProfileChange={onProfileChange}
            variant="mobile"
          />
        </div>
      </div>
    </div>
  );
}
