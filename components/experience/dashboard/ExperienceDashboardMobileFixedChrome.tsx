"use client";

import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardMobileFixedChromeProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
};

/** Top chrome — menu + profile orb grouped on the upper right. */
export default function ExperienceDashboardMobileFixedChrome({
  profile,
  onProfileChange,
}: ExperienceDashboardMobileFixedChromeProps) {
  return (
    <header
      data-dashboard-mobile-chrome
      className="dashboard-mobile-fixed-chrome pointer-events-none"
      aria-label="Dashboard navigation"
    >
      <div className="dashboard-mobile-fixed-chrome__actions pointer-events-auto">
        <ProfileOrbEditor
          profile={profile}
          onProfileChange={onProfileChange}
          size={36}
          forceInitials
        />
        <AwakeningMenuButton className="dashboard-mobile-fixed-chrome__menu shrink-0" />
      </div>
    </header>
  );
}
