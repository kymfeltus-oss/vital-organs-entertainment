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
  noiseGateDb: number;
  speechFloorDb: number;
  highPassCutoffHz: number | null;
  lowPassCutoffHz: number | null;
  inputGainDb: number;
  maxCrestFactor: number;
  minPitchCorrelation: number;
};

export const ACOUSTIC_MIC_CONSTRAINTS: MicProcessingConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

export const DIRECT_LINE_MIC_CONSTRAINTS: MicProcessingConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

export const ACOUSTIC_CAPTURE_CONFIG: StageCaptureConfig = {
  inputMode: "acoustic",
  noiseGateDb: -38,
  speechFloorDb: -50,
  highPassCutoffHz: 100,
  lowPassCutoffHz: 500,
  inputGainDb: 14,
  maxCrestFactor: 6.5,
  minPitchCorrelation: 0.08,
};

/** Analyser FFT — 1024 samples ≈ 23 ms @ 44.1 kHz (enough for 80 Hz YIN). */
export const CAPTURE_ANALYSER_FFT_SIZE = 1024;

/** Zero smoothing keeps spectral peaks responsive (no AnalyserNode lag). */
export const CAPTURE_ANALYSER_SMOOTHING = 0;

/** Frames required before median / note-lock publish (lower = faster, noisier). */
export const CAPTURE_STABILITY_FRAMES = 3;

export const DIRECT_LINE_CAPTURE_CONFIG: StageCaptureConfig = {
  inputMode: "directLine",
  noiseGateDb: -52,
  speechFloorDb: -58,
  highPassCutoffHz: null,
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
  activeOutputLabel: string;
  activeOutputDeviceId: string | null;
  noiseGateDb: number;
  headphonesConnected: boolean;
  sinkSelectionSupported: boolean;
  routingBusy: boolean;
  routingError: string | null;
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
  activeOutputLabel: "System Default",
  activeOutputDeviceId: null,
  noiseGateDb: ACOUSTIC_CAPTURE_CONFIG.noiseGateDb,
  headphonesConnected: false,
  sinkSelectionSupported: false,
  routingBusy: false,
  routingError: null,
  isInitialized: false,
};

export const COLEMAN_ROUTING_PROFILE_KEY = "coleman-routing-profile";
