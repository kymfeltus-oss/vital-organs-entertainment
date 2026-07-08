import {
  ACOUSTIC_CAPTURE_CONFIG,
  DIRECT_LINE_CAPTURE_CONFIG,
  type StageCaptureConfig,
} from "./stage-audio-types";

let activeConfig: StageCaptureConfig = { ...ACOUSTIC_CAPTURE_CONFIG };
let latencyOffsetMs = 0;

export function getStageCaptureConfig(): StageCaptureConfig {
  return activeConfig;
}

export function getStageLatencyOffsetMs(): number {
  return latencyOffsetMs;
}

export function setStageCaptureConfig(config: StageCaptureConfig): void {
  activeConfig = { ...config };
}

export function setStageLatencyOffsetMs(ms: number): void {
  latencyOffsetMs = Math.max(0, Math.min(500, Math.round(ms)));
}

export function applyInputModeCapture(inputMode: "acoustic" | "directLine", noiseGateDb: number): void {
  const base =
    inputMode === "directLine" ? DIRECT_LINE_CAPTURE_CONFIG : ACOUSTIC_CAPTURE_CONFIG;
  setStageCaptureConfig({
    ...base,
    noiseGateDb,
  });
}

export function applyPersistedCaptureSettings(
  inputSource: "ACOUSTIC_AIR" | "DIRECT_LINE" | "WIFI_STREAM",
  noiseGateDb: number,
  lowPassCutoffHz: number,
  offsetMs: number,
): "acoustic" | "directLine" {
  const inputMode = inputSource === "ACOUSTIC_AIR" ? "acoustic" : "directLine";
  const base =
    inputMode === "directLine" ? DIRECT_LINE_CAPTURE_CONFIG : ACOUSTIC_CAPTURE_CONFIG;

  setStageLatencyOffsetMs(offsetMs);
  setStageCaptureConfig({
    ...base,
    inputMode,
    noiseGateDb: Math.max(-160, Math.min(0, noiseGateDb)),
    lowPassCutoffHz: inputSource === "ACOUSTIC_AIR" ? lowPassCutoffHz : null,
  });

  return inputMode;
}
