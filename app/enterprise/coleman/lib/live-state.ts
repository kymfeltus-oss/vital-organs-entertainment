import type { LiveColemanState } from "./types";

/** Production standby — silence / listening until the mic engine publishes frames. */
export function createInitialLiveColemanState(): LiveColemanState {
  return {
    isMicActive: true,
    currentKey: null,
    currentCents: 0,
    chordProgression: [],
    intelligence: {
      status: "LIVE",
      functionName: null,
      cadencePotential: null,
      cadenceScore: 0,
      nashvilleNumber: null,
      scaleDegree: null,
      suggestedVoicings: [],
    },
  };
}
