import {
  ACOUSTIC_CAPTURE_CONFIG,
  DIRECT_LINE_CAPTURE_CONFIG,
  type StageCaptureConfig,
} from "./stage-audio-types";

let activeConfig: StageCaptureConfig = { ...ACOUSTIC_CAPTURE_CONFIG };

export function getStageCaptureConfig(): StageCaptureConfig {
  return activeConfig;
}

export function setStageCaptureConfig(config: StageCaptureConfig): void {
  activeConfig = { ...config };
}

export function applyInputModeCapture(inputMode: "acoustic" | "directLine", noiseGateDb: number): void {
  const base =
    inputMode === "directLine" ? DIRECT_LINE_CAPTURE_CONFIG : ACOUSTIC_CAPTURE_CONFIG;
  setStageCaptureConfig({
    ...base,
    noiseGateDb,
  });
}
