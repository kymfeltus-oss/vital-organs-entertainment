"use client";

import { useEffect } from "react";
import ExperienceDashboardDesktopView from "@/components/experience/dashboard/ExperienceDashboardDesktopView";
import ExperienceDashboardMobileView from "@/components/experience/dashboard/ExperienceDashboardMobileView";
import { AWAKENING_PRELOAD_ASSETS } from "@/lib/experience/awakening-dashboard-assets";

type ExperienceAttendeeDashboardProps = {
  displayName: string;
};

export default function ExperienceAttendeeDashboard({
  displayName,
}: ExperienceAttendeeDashboardProps) {
  useEffect(() => {
    for (const href of AWAKENING_PRELOAD_ASSETS) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      <ExperienceDashboardMobileView displayName={displayName} />
      <ExperienceDashboardDesktopView displayName={displayName} />
    </>
  );
}
