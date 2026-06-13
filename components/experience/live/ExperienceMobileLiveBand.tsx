"use client";

import type { ReactNode } from "react";
import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";
import FloatingLiveReactions from "@/components/experience/live/FloatingLiveReactions";
import StreamStageChrome from "@/components/experience/live/StreamStageChrome";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";

type ExperienceMobileLiveBandProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
};

export default function ExperienceMobileLiveBand({
  showPaywall,
  paywallOverlay,
}: ExperienceMobileLiveBandProps) {
  const { selectedExperience, handleExperienceUnavailable } = useLiveExperienceStream();

  return (
    <div className="relative aspect-[21/9] w-full shrink-0 overflow-hidden border-b border-white/[0.06] bg-black">
      <FloatingLiveReactions />
      <StreamStageChrome isLive />
      <AttendeeStreamPlayer
        key={selectedExperience}
        experience={selectedExperience}
        enabled
        showPaywall={showPaywall}
        paywallOverlay={paywallOverlay}
        onExperienceUnavailable={handleExperienceUnavailable}
        embedded
      />
    </div>
  );
}
