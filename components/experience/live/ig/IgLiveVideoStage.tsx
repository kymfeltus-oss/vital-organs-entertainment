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
        <div className="ig-live-preview-video h-full w-full" aria-hidden="true" />
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
