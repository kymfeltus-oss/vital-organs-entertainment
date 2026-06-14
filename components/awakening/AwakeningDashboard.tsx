"use client";

import { useEffect } from "react";
import "@/styles/awakening.css";
import type { ExperienceHubPayload } from "@/lib/experience/hub-content";
import { useExperienceHubLiveState } from "@/lib/experience/useExperienceHubLiveState";
import AmbientFooter from "@/components/awakening/AmbientFooter";
import DashboardBackground from "@/components/awakening/DashboardBackground";
import DashboardHeader from "@/components/awakening/DashboardHeader";
import DashboardHero from "@/components/awakening/DashboardHero";
import MissionStoryCard from "@/components/awakening/MissionStoryCard";
import OrbNavigation from "@/components/awakening/OrbNavigation";

type AwakeningDashboardProps = {
  initialPayload: ExperienceHubPayload;
};

export default function AwakeningDashboard({ initialPayload }: AwakeningDashboardProps) {
  const payload = useExperienceHubLiveState(initialPayload);
  const welcomeName = payload.user.firstName.toUpperCase();

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "initial",
        hypothesisId: "E",
        location: "AwakeningDashboard.tsx:render",
        message: "AwakeningDashboard render cycle",
        data: {
          welcomeName,
          initials: payload.user.initials,
          isStreamLive: payload.isStreamLive,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [welcomeName, payload.user.initials, payload.isStreamLive]);

  return (
    <main className="relative z-10 min-h-dvh w-full overflow-x-hidden bg-transparent pb-32 pt-safe text-white md:pb-28">
      <DashboardBackground />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
        <DashboardHeader
          welcomeName={welcomeName}
          initials={payload.user.initials}
          menuHref={payload.menuHref}
        />
        <div className="space-y-6">
          <DashboardHero liveHref={payload.isStreamLive ? "/experience/live" : undefined} />
          <MissionStoryCard />
          <OrbNavigation />
        </div>
      </div>

      <AmbientFooter />
    </main>
  );
}
