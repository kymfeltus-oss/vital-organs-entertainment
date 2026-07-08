export type MicPitchFrame = {
  currentKey: string | null;
  currentCents: number;
  /** True when the note passed the stability filter (not just a raw preview). */
  isStable: boolean;
};

export type MicEngineOptions = {
  onFrame: (frame: MicPitchFrame) => void;
  onError?: (message: string) => void;
};
