"use client";

import { useState } from "react";

import BottomNav from "@/app/enterprise/coleman/components/home/ui/BottomNav";
import ChordProgression from "@/app/enterprise/coleman/components/home/ui/ChordProgression";
import HomeHeader from "@/app/enterprise/coleman/components/home/ui/HomeHeader";
import IntelligenceCard from "@/app/enterprise/coleman/components/home/ui/IntelligenceCard";
import KeyOrb from "@/app/enterprise/coleman/components/home/ui/KeyOrb";
import { formatKeyDisplay } from "@/app/enterprise/coleman/lib/live-display";
import { useLiveColemanState } from "@/app/enterprise/coleman/lib/useLiveColemanState";

export default function ColemanHomePage() {
  const {
    liveData,
    sessionTonic,
    activeChordIndex,
    selectChord,
    micError,
    dismissMicError,
    isStandby,
    isLiveEngaged,
    noteSpelling,
    selectSpelling,
  } = useLiveColemanState();
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const bannerMessage = micError ?? playbackError;

  const { keyLabel, qualityLabel, badgeLabel } = formatKeyDisplay(
    liveData.currentKey,
    sessionTonic,
    liveData.currentCents,
    isStandby,
    noteSpelling,
  );

  return (
    <div className="coleman-premium-home coleman-reference-home relative flex h-full min-h-0 w-full flex-col overflow-hidden font-[family-name:var(--coleman-font,'Avenir_Next',ui-sans-serif,system-ui)]">
      <div className="coleman-premium-bg" aria-hidden>
        <div className="coleman-premium-wave coleman-premium-wave--1" />
        <div className="coleman-premium-wave coleman-premium-wave--2" />
        <div className="coleman-premium-wave coleman-premium-wave--3" />
        <div className="coleman-premium-wave coleman-premium-wave--4" />
        <div className="coleman-premium-wave coleman-premium-wave--5" />
        <div className="coleman-premium-vignette" />
      </div>

      <HomeHeader />

      <div className="coleman-home-content relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-[92px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bannerMessage ? (
          <div
            className="coleman-home-alert coleman-glass-panel mb-3 flex items-start justify-between gap-2 rounded-2xl px-3 py-2.5 text-[11px] text-[var(--cp-espresso)]"
            role="alert"
          >
            <span>{bannerMessage}</span>
            <button
              type="button"
              className="text-[9px] tracking-[0.1em] text-[var(--cp-muted)]"
              onClick={() => {
                dismissMicError();
                setPlaybackError(null);
              }}
            >
              DISMISS
            </button>
          </div>
        ) : null}

        <KeyOrb
          currentKey={keyLabel}
          keyQuality={qualityLabel}
          keyBadge={badgeLabel}
          isMicActive={liveData.isMicActive}
          isStandby={isStandby}
          noteSpelling={noteSpelling}
          onSelectSpelling={selectSpelling}
        />

        <ChordProgression
          chordProgression={liveData.chordProgression}
          activeChordIndex={activeChordIndex}
          onSelectChord={selectChord}
          isStandby={isStandby}
        />

        <IntelligenceCard
          currentKey={keyLabel}
          keyQuality={qualityLabel}
          intelligence={liveData.intelligence}
          isLiveEngaged={isLiveEngaged}
        />
      </div>

      <BottomNav onPlaybackError={setPlaybackError} />
    </div>
  );
}
