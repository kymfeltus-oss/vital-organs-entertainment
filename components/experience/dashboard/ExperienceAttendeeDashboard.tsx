"use client";

import { useEffect, useState } from "react";
import ExperienceDashboardDesktopView from "@/components/experience/dashboard/ExperienceDashboardDesktopView";
import ExperienceDashboardMobileView from "@/components/experience/dashboard/ExperienceDashboardMobileView";
import { AWAKENING_PRELOAD_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceAttendeeDashboardProps = {
  initialProfile: AttendeeProfileSnapshot;
};

export default function ExperienceAttendeeDashboard({
  initialProfile,
}: ExperienceAttendeeDashboardProps) {
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    for (const href of AWAKENING_PRELOAD_ASSETS) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <>
      <ExperienceDashboardMobileView profile={profile} onProfileChange={setProfile} />
      <ExperienceDashboardDesktopView profile={profile} onProfileChange={setProfile} />
    </>
  );
}
