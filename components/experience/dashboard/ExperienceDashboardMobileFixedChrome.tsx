"use client";

import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardMobileFixedChromeProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
};

/** Top chrome — menu, personalized welcome, profile orb (aligned to dashboard safe inset). */
export default function ExperienceDashboardMobileFixedChrome({
  profile,
  onProfileChange,
}: ExperienceDashboardMobileFixedChromeProps) {
  const welcomeName = profile.headerDisplayName || "GUEST";

  return (
    <header
      data-dashboard-mobile-chrome
      className="dashboard-mobile-fixed-chrome pointer-events-none"
      aria-label="Dashboard navigation"
    >
      <div className="dashboard-mobile-fixed-chrome__lead pointer-events-auto">
        <AwakeningMenuButton className="dashboard-mobile-fixed-chrome__menu shrink-0" />
        <div className="dashboard-mobile-fixed-chrome__welcome min-w-0">
          <p className="dashboard-mobile-fixed-chrome__welcome-label font-ui">Welcome</p>
          <div className="dashboard-hero-welcome-lines dashboard-mobile-fixed-chrome__welcome-lines">
            <h1 className="dashboard-hero-welcome-title truncate">{welcomeName}</h1>
          </div>
        </div>
      </div>

      <div className="dashboard-mobile-fixed-chrome__profile pointer-events-auto">
        <ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size={36} />
      </div>
    </header>
  );
}
