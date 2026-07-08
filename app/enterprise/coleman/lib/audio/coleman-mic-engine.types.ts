export type MicPitchFrame = {
  currentKey: string | null;
  currentCents: number;
};

export type MicEngineOptions = {
  onFrame: (frame: MicPitchFrame) => void;
  onError?: (message: string) => void;
};
