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
    const mainLandmark = document.getElementById("main-content");
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "a11y-main-landmark",
        hypothesisId: "MAIN-LANDMARK",
        location: "ExperienceAttendeeDashboard.tsx:mount",
        message: "main landmark presence",
        data: {
          hasMainLandmark: Boolean(mainLandmark),
          mainTagName: mainLandmark?.tagName ?? null,
          mainChildCount: mainLandmark?.childElementCount ?? 0,
          pathname: window.location.pathname,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

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
