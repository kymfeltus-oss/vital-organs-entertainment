"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import ExperienceDashboardContent from "@/components/experience/dashboard/ExperienceDashboardContent";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardDesktopViewProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardDesktopView({
  profile,
  onProfileChange,
  initialCountdownConfig,
}: ExperienceDashboardDesktopViewProps) {
  return (
    <div className="relative hidden h-dvh min-h-dvh w-full overflow-hidden bg-brand-black md:block">
      <ExperienceDashboardBackdrop variant="desktop" />

      <div data-dashboard-scroll="desktop" className="relative z-10 h-full w-full overflow-hidden pb-safe">
        <div className="relative h-full min-h-0 w-full">
          <ExperienceDashboardContent
            profile={profile}
            onProfileChange={onProfileChange}
            variant="desktop"
            initialCountdownConfig={initialCountdownConfig}
          />
        </div>
      </div>
    </div>
  );
}
