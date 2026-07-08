export type TrackData = {
  id: string;
  title: string;
  artist?: string;
  musicalKey: string;
  bpm: number;
  duration: string;
  audioFiles: string[];
  createdAt: string;
};

export type PlaybackHistoryEntry = {
  id: string;
  trackId: string;
  title: string;
  playedAt: string;
};

export type TheoryEntry = {
  id: string;
  title: string;
  key: string;
  nashvilleNumbers: string;
  progressionLabel: string;
  churchMovement: string;
};

export type ApiErrorBody = {
  error: string;
};

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

export { createInitialLiveColemanState } from "./live-state";
