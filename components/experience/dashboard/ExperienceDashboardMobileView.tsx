"use client";

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
      className="experience-dashboard-stage relative flex h-dvh max-h-dvh min-h-0 w-full flex-col items-stretch justify-start overflow-hidden overscroll-none bg-brand-black pt-safe pb-safe"
    >
      <ExperienceDashboardMobileFixedChrome
        profile={profile}
        onProfileChange={onProfileChange}
      />

      <div className="relative z-10 flex min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
        <ExperienceDashboardContent />
      </div>
    </div>
  );
}
