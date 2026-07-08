"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { startColemanMicEngine } from "@/app/enterprise/coleman/lib/audio/coleman-mic-engine";
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

export function useLiveColemanState() {
  const [liveData, setLiveData] = useState<LiveColemanState>(createInitialLiveColemanState);
  const [micError, setMicError] = useState<string | null>(null);
  const [activeChordIndex, setActiveChordIndex] = useState<number>(0);
  const [sessionTonic, setSessionTonic] = useState<string | null>(null);
  const [isLiveEngaged, setIsLiveEngaged] = useState(false);
  const [noteSpelling, setNoteSpelling] = useState<NoteSpelling>("flat");

  const sessionTrackerRef = useRef(new LiveSessionTonicTracker());
  const chordTrackerRef = useRef(new LiveChordTracker());
  const activeChordIndexRef = useRef<number>(0);

  useEffect(() => {
    activeChordIndexRef.current = activeChordIndex;
  }, [activeChordIndex]);

  const displayData = useMemo(
    () => resolveDisplayLiveState(liveData, activeChordIndex, isLiveEngaged),
    [liveData, activeChordIndex, isLiveEngaged],
  );

  useEffect(() => {
    if (!liveData.isMicActive) {
      return undefined;
    }

    sessionTrackerRef.current.reset();
    chordTrackerRef.current.reset();
    setSessionTonic(null);
    setIsLiveEngaged(false);
    setActiveChordIndex(0);
    activeChordIndexRef.current = 0;

    const stopMic = startColemanMicEngine({
      onFrame: ({ currentKey, currentCents }) => {
        if (currentKey) {
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

    return stopMic;
  }, [liveData.isMicActive]);

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

  const dismissMicError = useCallback(() => setMicError(null), []);

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
