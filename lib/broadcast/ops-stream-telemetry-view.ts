import type { OpsStreamTelemetryView } from "@/lib/broadcast/countdown-console-types";
import type { OpsStreamState } from "@/lib/ops/ops-stream-state";
import type { OpsSnapshot } from "@/lib/ops/types";

export function resolvePreviewPlaybackUrl(
  stream: OpsSnapshot["stream"] | null | undefined,
): string | null {
  const preview = stream?.cameraPreviewHlsUrl?.trim() ?? "";
  if (preview.length > 0) return preview;
  const playback = stream?.primaryPlaybackUrl?.trim() ?? "";
  return playback.length > 0 ? playback : null;
}

/** Map derived ops telemetry into countdown console strip props. */
export function toOpsStreamTelemetryView(
  opsState: OpsStreamState | null,
  stream: OpsSnapshot["stream"] | null,
): OpsStreamTelemetryView | null {
  if (!opsState) return null;

  const ingestStatus: OpsStreamTelemetryView["ingestStatus"] = !opsState.apiOk
    ? "error"
    : opsState.pullEngineStatus === "running"
      ? "connected"
      : opsState.pullEngineStatus === "error"
        ? "error"
        : "disconnected";

  const fatalError =
    ingestStatus === "error" && !opsState.isLive
      ? "Stream ingest unavailable — verify Restream and encoder paths."
      : null;

  const bitrateMbps = opsState.isLive ? 4.2 : 0;

  return {
    isLive: opsState.isLive,
    ingestStatus,
    resolutionLabel: opsState.videoResolution,
    resolution: opsState.videoResolution,
    droppedFramesPercent: opsState.droppedFramesPercent,
    latencySeconds: opsState.latencySeconds,
    bitrateMbps,
    fatalError,
  };
}
