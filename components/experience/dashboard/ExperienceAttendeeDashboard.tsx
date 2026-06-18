"use client";

import { useEffect, useState } from "react";
import ExperienceDashboardMobileView from "@/components/experience/dashboard/ExperienceDashboardMobileView";
import { AWAKENING_PRELOAD_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceAttendeeDashboardProps = {
  initialProfile: AttendeeProfileSnapshot;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceAttendeeDashboard({
  initialProfile,
  initialCountdownConfig,
}: ExperienceAttendeeDashboardProps) {
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    for (const asset of AWAKENING_PRELOAD_ASSETS) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = asset.as;
      link.href = asset.href;
      document.head.appendChild(link);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <ExperienceDashboardMobileView
      profile={profile}
      onProfileChange={setProfile}
      initialCountdownConfig={initialCountdownConfig}
    />
  );
}
