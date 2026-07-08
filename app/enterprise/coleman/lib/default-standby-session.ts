import type { LiveColemanState } from "./types";

/** Artboard standby — shown until live mic/chord detection engages. */
export const STANDBY_SESSION_TONIC = "Db";

export const STANDBY_CHORD_PROGRESSION = [
  "Db / I",
  "Ab / IV",
  "Bbm / vii°",
  "Gb / III",
  "Db / I",
] as const;

export const STANDBY_BAR_COUNT_LABEL = "8 BARS";

export const STANDBY_KEY_QUALITY = "Db MAJOR";

export const STANDBY_KEY_BADGE = "6 ♭";

export const STANDBY_INTELLIGENCE: LiveColemanState["intelligence"] = {
  status: "LIVE",
  functionName: "TONIC / I",
  cadencePotential: "STRONG",
  cadenceScore: 72,
  nashvilleNumber: "1",
  scaleDegree: "1 / 7",
  suggestedVoicings: ["Db / F", "Ab / Db", "Db / Ab", "F / Db"],
};

export function createStandbyLiveState(): LiveColemanState {
  return {
    isMicActive: true,
    currentKey: STANDBY_SESSION_TONIC,
    currentCents: 0,
    chordProgression: [...STANDBY_CHORD_PROGRESSION],
    intelligence: { ...STANDBY_INTELLIGENCE },
  };
}

export function isLiveEngagedFromState(liveData: LiveColemanState): boolean {
  return liveData.currentKey !== null || liveData.chordProgression.length > 0;
}
