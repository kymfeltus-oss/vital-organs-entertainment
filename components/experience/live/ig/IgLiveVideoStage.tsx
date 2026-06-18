"use client";

import type { ReactNode } from "react";
import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";
import FloatingLiveReactions from "@/components/experience/live/FloatingLiveReactions";
import IgLiveWaitingStage, {
  type IgLiveWaitingState,
} from "@/components/experience/live/ig/IgLiveWaitingStage";
import type { IgLiveShellMode } from "@/components/experience/live/ig/ig-live-shell-types";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";

type IgLiveVideoStageProps = {
  mode: IgLiveShellMode;
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  waiting: IgLiveWaitingState;
};

export default function IgLiveVideoStage({
  mode,
  showPaywall,
  paywallOverlay,
  waiting,
}: IgLiveVideoStageProps) {
  const { selectedExperience, handleExperienceUnavailable } = useLiveExperienceStream();
  const isLive = mode === "live";

  return (
    <div className="ig-live-video-stage absolute inset-0 overflow-hidden bg-black">
      {isLive ? (
        <AttendeeStreamPlayer
          key={selectedExperience}
          experience={selectedExperience}
          enabled
          showPaywall={showPaywall}
          paywallOverlay={paywallOverlay}
          onExperienceUnavailable={handleExperienceUnavailable}
          embedded
        />
      ) : (
        <IgLiveWaitingStage {...waiting} />
      )}

      {isLive ? <FloatingLiveReactions /> : null}
    </div>
  );
}
