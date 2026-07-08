export interface LiveColemanState {
  isMicActive: boolean;
  currentKey: string | null;
  currentCents: number;
  chordProgression: string[];
  intelligence: {
    status: "LIVE" | "OFFLINE";
    functionName: string | null;
    cadencePotential: string | null;
    cadenceScore: number;
    nashvilleNumber: string | null;
    scaleDegree: string | null;
    suggestedVoicings: string[];
  };
}

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
