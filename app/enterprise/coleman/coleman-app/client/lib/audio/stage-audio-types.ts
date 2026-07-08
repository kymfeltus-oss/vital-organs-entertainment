export type StageRoutingProfile = "headphones" | "speaker";

export type InputSourceMode = "acoustic" | "directLine";

/** Browser getUserMedia constraints — tuned for pitch, not telephony. */
export type MicProcessingConstraints = {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
};

export type StageCaptureConfig = {
  inputMode: InputSourceMode;
  /** RMS gate for stable pitch lock. */
  noiseGateDb: number;
  /** Lower VAD floor — opens detection for quiet speech. */
  speechFloorDb: number;
  lowPassCutoffHz: number | null;
  /** Software boost applied in Web Audio before analysis. */
  inputGainDb: number;
  /** Reject peak/RMS ratios above this (phone drops, taps). */
  maxCrestFactor: number;
  /** Minimum autocorrelation confidence for pitched content. */
  minPitchCorrelation: number;
};

export const ACOUSTIC_MIC_CONSTRAINTS: MicProcessingConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: true,
};

export const DIRECT_LINE_MIC_CONSTRAINTS: MicProcessingConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

export const ACOUSTIC_CAPTURE_CONFIG: StageCaptureConfig = {
  inputMode: "acoustic",
  noiseGateDb: -38,
  speechFloorDb: -46,
  lowPassCutoffHz: 800,
  inputGainDb: 14,
  maxCrestFactor: 6.5,
  minPitchCorrelation: 0.12,
};

export const DIRECT_LINE_CAPTURE_CONFIG: StageCaptureConfig = {
  inputMode: "directLine",
  noiseGateDb: -52,
  speechFloorDb: -58,
  lowPassCutoffHz: null,
  inputGainDb: 0,
  maxCrestFactor: 8,
  minPitchCorrelation: 0.1,
};

export type StageAudioDevice = {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
  isExternal: boolean;
};

export type StageAudioState = {
  routingProfile: StageRoutingProfile;
  inputMode: InputSourceMode;
  externalLineConnected: boolean;
  activeInputLabel: string;
  noiseGateDb: number;
  headphonesConnected: boolean;
  isInitialized: boolean;
};

export function micConstraintsForInputMode(inputMode: InputSourceMode): MicProcessingConstraints {
  return inputMode === "directLine" ? DIRECT_LINE_MIC_CONSTRAINTS : ACOUSTIC_MIC_CONSTRAINTS;
}

export const DEFAULT_STAGE_AUDIO_STATE: StageAudioState = {
  routingProfile: "headphones",
  inputMode: "acoustic",
  externalLineConnected: false,
  activeInputLabel: "Internal Microphone",
  noiseGateDb: ACOUSTIC_CAPTURE_CONFIG.noiseGateDb,
  headphonesConnected: false,
  isInitialized: false,
};
