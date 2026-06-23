import type { AudioChannel } from "@/lib/broadcast/types";
import type { StreamTelemetry } from "@/lib/broadcast/types";
import type { OpsSnapshot } from "@/lib/ops/types";
import {
  DEFAULT_STUDIO_ENGINE_MODE,
  type StudioEngineMode,
} from "@/lib/ops/studio-engine-mode";

export type PullEngineStatus = "running" | "stopped" | "error";

export type OpsStreamAudioLevels = {
  master: number;
  cam1: number;
  cam2: number;
  cam3: number;
  cam4: number;
  media1: number;
  media2: number;
};

export type OpsStreamState = {
  isLive: boolean;
  apiOk: boolean;
  studioEngineMode: StudioEngineMode;
  pullEngineStatus: PullEngineStatus;
  uptime: string;
  videoResolution: string;
  fps: number;
  droppedFramesPercent: number;
  latencySeconds: number;
  outputsActive: number;
  outputsTotal: number;
  localInputsActive: number;
  audioLevels: OpsStreamAudioLevels;
};

export type OpsStreamTelemetryInput = {
  stream: OpsSnapshot["stream"] | null;
  audioChannels?: AudioChannel[];
  streamTelemetry?: StreamTelemetry | null;
  liveSinceMs?: number | null;
  /** Live mic meter from internal-studio getUserMedia (local desk testing). */
  localWebcamAudioLevel?: number;
  /** TODO: replace with WebRTC peer count when signaling service lands. */
  localPeerCount?: number;
};

const SILENT_METER_FLOOR = 4;

export function formatAudioDb(level: number | null | undefined): string {
  if (level == null || level <= SILENT_METER_FLOOR) return "-∞ dB";
  const db = -60 + (level / 100) * 54;
  return `${db.toFixed(1)} dB`;
}

function resolveChannelLevel(
  channels: AudioChannel[],
  matchers: RegExp[],
): number | null {
  const match = channels.find((channel) =>
    matchers.some((pattern) => pattern.test(channel.name.toLowerCase())),
  );
  if (!match) return null;
  return match.meterLevel;
}

export function buildOpsStreamAudioLevels(
  channels: AudioChannel[] = [],
  localWebcamAudioLevel = 0,
): OpsStreamAudioLevels {
  const cam1 = resolveChannelLevel(channels, [/cam\s*1/, /camera guy/, /restream pull/]);
  const cam2 = resolveChannelLevel(channels, [/cam\s*2/, /main stage/]);
  const cam3 = resolveChannelLevel(channels, [/cam\s*3/]);
  const cam4 = resolveChannelLevel(channels, [/cam\s*4/]);
  const media1 = resolveChannelLevel(channels, [/media\s*1/]);
  const media2 = resolveChannelLevel(channels, [/media\s*2/]);

  const resolvedCam1 = Math.max(cam1 ?? 0, localWebcamAudioLevel);

  const values = [resolvedCam1, cam2, cam3, cam4, media1, media2].filter(
    (value): value is number => value != null && value > SILENT_METER_FLOOR,
  );
  const master =
    values.length > 0
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;

  return {
    master,
    cam1: resolvedCam1,
    cam2: cam2 ?? 0,
    cam3: cam3 ?? 0,
    cam4: cam4 ?? 0,
    media1: media1 ?? 0,
    media2: media2 ?? 0,
  };
}

function formatUptime(liveSinceMs: number | null | undefined): string {
  if (!liveSinceMs) return "00:00:00";
  const elapsedSec = Math.max(0, Math.floor((Date.now() - liveSinceMs) / 1000));
  const hours = Math.floor(elapsedSec / 3600);
  const minutes = Math.floor((elapsedSec % 3600) / 60);
  const seconds = elapsedSec % 60;
  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
}

function resolvePullEngineStatus(
  stream: OpsSnapshot["stream"] | null,
  apiOk: boolean,
  engineForced: PullEngineStatus | null,
): PullEngineStatus {
  if (engineForced) return engineForced;
  if (!stream) return "stopped";

  const hasPartialConfig =
    stream.primaryRtmpPullConfigured ||
    stream.cameraPreviewConfigured ||
    stream.primaryRtmpConfigured;

  if (!apiOk && hasPartialConfig) return "error";
  if (stream.isLive || (stream.cameraPreviewConfigured && stream.cameraPreviewHlsUrl)) {
    return "running";
  }
  if (hasPartialConfig) return "stopped";
  return "stopped";
}

export function buildOpsStreamState(input: OpsStreamTelemetryInput): OpsStreamState {
  const {
    stream,
    audioChannels = [],
    streamTelemetry,
    liveSinceMs,
    localWebcamAudioLevel = 0,
    localPeerCount = 0,
  } = input;

  const outputs = stream?.storedRestreamOutputs ?? {
    pushConfigured: false,
    pullConfigured: false,
    previewConfigured: false,
    playbackConfigured: false,
    provisionedCount: 0,
    totalLanes: 4 as const,
  };

  const apiOk =
    outputs.pushConfigured ||
    outputs.pullConfigured ||
    stream?.studioEngineMode === "internal_studio";

  const isLive = stream?.isLive === true;
  const studioEngineMode = stream?.studioEngineMode ?? DEFAULT_STUDIO_ENGINE_MODE;

  const latencySeconds =
    streamTelemetry?.latencyMs != null
      ? streamTelemetry.latencyMs / 1000
      : isLive
        ? 2.4
        : 0;

  const droppedFramesPercent = isLive
    ? Math.max(
        streamTelemetry?.packetLossPercent ?? 0,
        streamTelemetry?.droppedFrames && streamTelemetry.droppedFrames > 0 ? 1.2 : 0,
      )
    : 0;

  const fps =
    isLive && streamTelemetry?.destinations?.[0]
      ? 29.97
      : isLive
        ? 29.97
        : 0;

  const videoResolution = isLive ? "1920×1080" : "—";

  const localInputsActive =
    studioEngineMode === "internal_studio"
      ? Math.min(
          4,
          localPeerCount +
            (localWebcamAudioLevel > SILENT_METER_FLOOR ||
            audioChannels.filter((ch) => ch.meterLevel > SILENT_METER_FLOOR).length > 0
              ? 1
              : 0),
        )
      : outputs.provisionedCount;

  const pullEngineStatus = resolvePullEngineStatus(stream, apiOk, null);

  return {
    isLive,
    apiOk,
    studioEngineMode,
    pullEngineStatus,
    uptime: formatUptime(liveSinceMs),
    videoResolution,
    fps,
    droppedFramesPercent,
    latencySeconds,
    outputsActive: outputs.provisionedCount,
    outputsTotal: outputs.totalLanes,
    localInputsActive,
    audioLevels: buildOpsStreamAudioLevels(audioChannels, localWebcamAudioLevel),
  };
}
