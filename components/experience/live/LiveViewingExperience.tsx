"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";
import ExperienceSelector from "@/components/experience/live/ExperienceSelector";
import FloatingLiveReactions from "@/components/experience/live/FloatingLiveReactions";
import StreamStageChrome from "@/components/experience/live/StreamStageChrome";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";

const LivePollPanel = dynamic(
  () => import("@/components/experience/live/LivePollPanel"),
  { ssr: false },
);

type LiveViewingExperienceProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  hidePlayerOnMobile?: boolean;
  /** When true, polls/selector render elsewhere (mobile portrait layout). */
  hideInteractive?: boolean;
};

export default function LiveViewingExperience({
  showPaywall,
  paywallOverlay,
  hidePlayerOnMobile = false,
  hideInteractive = false,
}: LiveViewingExperienceProps) {
  const {
    feeds,
    showSelector,
    selectedExperience,
    setSelectedExperience,
    fallbackNotice,
    handleExperienceUnavailable,
  } = useLiveExperienceStream();

  return (
    <div className="experience-live-stage-fit relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-col gap-2 md:gap-3">
      <div
        className={`experience-stream-stage relative w-full min-w-0 shrink-0 overflow-hidden rounded-none md:rounded-xl ${
          hidePlayerOnMobile ? "max-md:hidden" : ""
        }`}
      >
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

      {!hideInteractive ? (
        <div className="experience-live-interactive flex w-full min-w-0 max-w-full shrink-0 flex-col gap-2 md:gap-3">
          {showSelector ? (
            <div className="experience-live-selector-slot">
              <ExperienceSelector
                feeds={feeds}
                selectedKey={selectedExperience}
                onSelect={setSelectedExperience}
              />
            </div>
          ) : null}

          <LivePollPanel />

          {fallbackNotice ? (
            <p className="font-body text-xs leading-relaxed text-zinc-400" role="status">
              {fallbackNotice}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
