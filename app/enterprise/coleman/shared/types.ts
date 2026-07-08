export type SongOverview = {
  title: string;
  artist: string;
  originalKey: string;
  tempoBpm: number;
  churchMovement: string;
  nashvilleNumbers: string;
  progressionLabel: string;
  source: "shazam" | "acrcloud";
};

export type RecognizeRequest = {
  audioSample?: string;
  fingerprint?: string;
};
