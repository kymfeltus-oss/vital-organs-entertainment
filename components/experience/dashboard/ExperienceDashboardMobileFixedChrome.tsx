"use client";

import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardMobileFixedChromeProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
};

/** Profile orb only — welcome copy lives on the mobile backdrop art, outside scroll. */
export default function ExperienceDashboardMobileFixedChrome({
  profile,
  onProfileChange,
}: ExperienceDashboardMobileFixedChromeProps) {
  return (
    <div
      data-dashboard-mobile-chrome
      className="dashboard-mobile-fixed-chrome pointer-events-auto fixed z-[60] md:hidden"
      style={{
        top: "max(0.5rem, env(safe-area-inset-top))",
        right: "max(0.5rem, env(safe-area-inset-right))",
      }}
    >
      <ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size={36} />
    </div>
  );
}
