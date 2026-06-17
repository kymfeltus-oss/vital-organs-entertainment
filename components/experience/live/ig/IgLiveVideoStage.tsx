"use client";

import type { ReactNode } from "react";
import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";
import FloatingLiveReactions from "@/components/experience/live/FloatingLiveReactions";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";

type IgLiveVideoStageProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  preview?: boolean;
};

export default function IgLiveVideoStage({
  showPaywall,
  paywallOverlay,
  preview = false,
}: IgLiveVideoStageProps) {
  const { selectedExperience, handleExperienceUnavailable } = useLiveExperienceStream();

  return (
    <div className="ig-live-video-stage absolute inset-0 overflow-hidden bg-black">
      {preview ? (
        <div
          className="ig-live-video h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(165deg, rgba(0,168,255,0.12) 0%, rgba(0,0,0,0.92) 45%, rgba(255,0,140,0.08) 100%), url(/awakening/dashboard-concert-bg-mobile.png)",
          }}
          aria-hidden="true"
        />
      ) : (
        <AttendeeStreamPlayer
          key={selectedExperience}
          experience={selectedExperience}
          enabled
          showPaywall={showPaywall}
          paywallOverlay={paywallOverlay}
          onExperienceUnavailable={handleExperienceUnavailable}
          embedded
        />
      )}

      <FloatingLiveReactions />
    </div>
  );
}
