"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useWebAudioPitchTracker } from "@/app/enterprise/coleman/lib/hooks/useWebAudioPitchTracker";
import { isLiveEngagedFromState } from "@/app/enterprise/coleman/lib/default-standby-session";
import { LiveChordTracker } from "@/app/enterprise/coleman/lib/live-chord-tracker";
import { resolveDisplayLiveState } from "@/app/enterprise/coleman/lib/live-display";
import { LiveSessionTonicTracker } from "@/app/enterprise/coleman/lib/live-session-tonic";
import { deriveLiveIntelligence, type NoteSpelling } from "@/app/enterprise/coleman/lib/live-theory";
import { createInitialLiveColemanState } from "@/app/enterprise/coleman/lib/live-state";
import type { LiveColemanState } from "@/app/enterprise/coleman/lib/types";

function buildLivePatch(
  prev: LiveColemanState,
  frame: { currentKey: string | null; currentCents: number },
  sessionTonic: string | null,
  chordProgression: string[],
  activeChordIndex: number | null,
): LiveColemanState {
  const intelligence = deriveLiveIntelligence({
    detectedNote: frame.currentKey,
    sessionTonic,
    cents: frame.currentCents,
    chordProgression,
    activeChordIndex,
  });

  return {
    ...prev,
    currentKey: frame.currentKey,
    currentCents: frame.currentCents,
    chordProgression,
    intelligence: {
      ...intelligence,
      status: prev.intelligence.status,
    },
  };
}

type UseLiveColemanStateOptions = {
  /** When false, mic engine stays offline (SSR / pre-mount gate). */
  audioEnabled?: boolean;
};

export function useLiveColemanState(options: UseLiveColemanStateOptions = {}) {
  const { audioEnabled = true } = options;

  const [liveData, setLiveData] = useState<LiveColemanState>(createInitialLiveColemanState);
  const [micError, setMicError] = useState<string | null>(null);
  const [activeChordIndex, setActiveChordIndex] = useState<number>(0);
  const [sessionTonic, setSessionTonic] = useState<string | null>(null);
  const [isLiveEngaged, setIsLiveEngaged] = useState(false);
  const [noteSpelling, setNoteSpelling] = useState<NoteSpelling>("flat");

  const sessionTrackerRef = useRef(new LiveSessionTonicTracker());
  const chordTrackerRef = useRef(new LiveChordTracker());
  const activeChordIndexRef = useRef<number>(0);

  const { startLiveWebAudioTracking, killWebAudioTracking } = useWebAudioPitchTracker({
    onFrame: ({ currentKey, currentCents, isStable }) => {
      if (currentKey && isStable) {
        setIsLiveEngaged(true);
      }

      const nextSessionTonic = sessionTrackerRef.current.tick(currentKey);
      const chordProgression = chordTrackerRef.current.tick(currentKey, nextSessionTonic);

      if (chordProgression.length > 0) {
        setIsLiveEngaged(true);
      }

      setSessionTonic(nextSessionTonic);

      setLiveData((prev) => {
        const next = buildLivePatch(
          prev,
          { currentKey, currentCents },
          nextSessionTonic,
          chordProgression,
          activeChordIndexRef.current,
        );

        if (chordProgression.length > 0 && !isLiveEngagedFromState(prev)) {
          activeChordIndexRef.current = chordProgression.length - 1;
          setActiveChordIndex(chordProgression.length - 1);
          return buildLivePatch(
            next,
            { currentKey, currentCents },
            nextSessionTonic,
            chordProgression,
            chordProgression.length - 1,
          );
        }

        return next;
      });
    },
    onError: (message) => {
      setMicError(message);
      setLiveData((prev) => ({
        ...prev,
        isMicActive: false,
        intelligence: { ...prev.intelligence, status: "OFFLINE" },
      }));
    },
  });

  useEffect(() => {
    activeChordIndexRef.current = activeChordIndex;
  }, [activeChordIndex]);

  const displayData = useMemo(
    () => resolveDisplayLiveState(liveData, activeChordIndex, isLiveEngaged),
    [liveData, activeChordIndex, isLiveEngaged],
  );

  useEffect(() => {
    if (!audioEnabled || !liveData.isMicActive) {
      killWebAudioTracking();
      return undefined;
    }

    sessionTrackerRef.current.reset();
    chordTrackerRef.current.reset();
    setSessionTonic(null);
    setIsLiveEngaged(false);
    setActiveChordIndex(0);
    activeChordIndexRef.current = 0;

    startLiveWebAudioTracking();

    return () => {
      killWebAudioTracking();
    };
  }, [
    audioEnabled,
    liveData.isMicActive,
    startLiveWebAudioTracking,
    killWebAudioTracking,
  ]);

  const selectChord = useCallback(
    (index: number) => {
      setActiveChordIndex(index);
      activeChordIndexRef.current = index;

      if (!isLiveEngaged) {
        return;
      }

      setLiveData((prev) =>
        buildLivePatch(
          prev,
          { currentKey: prev.currentKey, currentCents: prev.currentCents },
          sessionTrackerRef.current.getTonic(),
          prev.chordProgression,
          index,
        ),
      );
    },
    [isLiveEngaged],
  );

  const dismissMicError = useCallback(() => {
    setMicError(null);
    setLiveData((prev) => ({
      ...prev,
      isMicActive: true,
      intelligence: { ...prev.intelligence, status: "LIVE" },
    }));
  }, []);

  const selectSpelling = useCallback((spelling: NoteSpelling) => {
    setNoteSpelling(spelling);
  }, []);

  const displaySessionTonic = isLiveEngaged
    ? sessionTonic
    : displayData.currentKey;

  return {
    liveData: displayData,
    rawLiveData: liveData,
    isLiveEngaged,
    sessionTonic: displaySessionTonic,
    activeChordIndex,
    selectChord,
    micError,
    dismissMicError,
    isStandby: !isLiveEngaged,
    noteSpelling,
    selectSpelling,
  };
}
