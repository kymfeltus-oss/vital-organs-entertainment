import {
  BROADCAST_PACKET_LOSS_BLOCK_PERCENT,
  BROADCAST_PREFERRED_CAMERA_COUNT,
  BROADCAST_STORAGE_WARNING_GB,
  isBroadcastDevMode,
} from "@/services/broadcast/config";
import type {
  AudioTelemetry,
  HardwareSource,
  HealthStatus,
  ProductionState,
  ReadinessFailure,
  ReadinessReport,
  StreamTelemetry,
} from "@/lib/broadcast/types";

export type ReadinessInput = {
  sources: HardwareSource[];
  audio: AudioTelemetry;
  stream: StreamTelemetry;
  production: ProductionState;
  devMode?: boolean;
};

function failure(
  id: string,
  label: string,
  status: HealthStatus,
  message: string,
  hardBlock = status === "black",
): ReadinessFailure {
  return { id, label, status, message, hardBlock };
}

function scoreFromFailures(all: ReadinessFailure[]): number {
  const penalties: Record<HealthStatus, number> = {
    green: 0,
    yellow: 8,
    orange: 14,
    red: 28,
    black: 40,
  };

  const raw = all.reduce((score, item) => score - penalties[item.status], 100);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export class ReadinessEngine {
  evaluate(input: ReadinessInput): ReadinessReport {
    const devMode = input.devMode ?? isBroadcastDevMode();
    const onlineSources = input.sources.filter((source) => source.online);
    const criticalFailures: ReadinessFailure[] = [];
    const warnings: ReadinessFailure[] = [];
    const hardBlocks: ReadinessFailure[] = [];

    const push = (item: ReadinessFailure) => {
      if (item.hardBlock) {
        hardBlocks.push(item);
        criticalFailures.push(item);
        return;
      }
      if (item.status === "red") {
        criticalFailures.push(item);
        return;
      }
      warnings.push(item);
    };

    if (onlineSources.length === 0) {
      push(
        failure(
          "video_source",
          "Video Source",
          devMode ? "red" : "black",
          devMode
            ? "No functional video sources online"
            : "No hardware connected — adapters must provide sources",
          !devMode,
        ),
      );
    }

    if (
      onlineSources.length > 0 &&
      onlineSources.length < BROADCAST_PREFERRED_CAMERA_COUNT
    ) {
      push(
        failure(
          "camera_count",
          "Camera Count",
          "yellow",
          `Only ${onlineSources.length} of ${BROADCAST_PREFERRED_CAMERA_COUNT} preferred cameras online`,
        ),
      );
    }

    if (!input.audio.masterPresent) {
      push(
        failure(
          "master_audio_missing",
          "Master Audio",
          "black",
          "Master audio bus not present",
          true,
        ),
      );
    } else if (input.audio.masterSilent) {
      push(
        failure(
          "master_audio_silent",
          "Master Audio Silence",
          "orange",
          "Master audio is silent",
        ),
      );
    }

    if (input.audio.masterClipping) {
      push(
        failure(
          "master_clipping",
          "Master Clipping",
          "red",
          "Critical clipping on master bus",
        ),
      );
    }

    const connectedDestinations = input.stream.destinations.filter((d) => d.connected);
    if (connectedDestinations.length === 0) {
      push(
        failure(
          "destinations",
          "Stream Destinations",
          devMode ? "orange" : "black",
          "No distribution destinations connected",
          !devMode,
        ),
      );
    }

    if (input.stream.packetLossPercent > BROADCAST_PACKET_LOSS_BLOCK_PERCENT) {
      push(
        failure(
          "packet_loss",
          "Packet Loss",
          "black",
          `Packet loss ${input.stream.packetLossPercent.toFixed(1)}% exceeds threshold`,
          true,
        ),
      );
    }

    if (input.stream.encoderOverloaded) {
      push(
        failure(
          "encoder_overload",
          "Encoder Overload",
          "black",
          "Encoder overload detected",
          true,
        ),
      );
    }

    if (!input.stream.pipelineAvailable) {
      push(
        failure(
          "pipeline_unavailable",
          "Stream Pipeline",
          "black",
          "Stream pipeline unavailable",
          true,
        ),
      );
    }

    if (input.stream.internetStatus === "offline") {
      push(
        failure(
          "internet",
          "Internet Status",
          "black",
          "Uplink offline — cannot go live",
          true,
        ),
      );
    } else if (input.stream.internetStatus === "degraded") {
      push(
        failure(
          "internet_degraded",
          "Internet Status",
          "yellow",
          "Uplink degraded — monitor closely",
        ),
      );
    }

    if (input.production.storageAvailableGb < BROADCAST_STORAGE_WARNING_GB) {
      push(
        failure(
          "storage",
          "Storage Available",
          "orange",
          `Only ${input.production.storageAvailableGb} GB free`,
        ),
      );
    }

    if (!input.production.isRecording) {
      push(
        failure(
          "recording",
          "Recording Enabled",
          "yellow",
          "ISO recording not enabled",
        ),
      );
    }

    if (!input.production.programSourceId) {
      push(
        failure(
          "program_source",
          "Program Source",
          "black",
          "No program source selected",
          true,
        ),
      );
    }

    const allFailures = [...criticalFailures, ...warnings];
    const hasHardBlock = hardBlocks.length > 0;
    const hasCritical = criticalFailures.some((f) => !f.hardBlock && f.status === "red");
    const hasBlockingWarnings = warnings.some((f) => f.status === "orange");

    const canGoLive =
      !hasHardBlock && !hasCritical && !hasBlockingWarnings && onlineSources.length > 0;

    return {
      timestamp: new Date().toISOString(),
      score: scoreFromFailures(allFailures),
      canGoLive,
      criticalFailures,
      warnings,
      hardBlocks,
      supervisorOverridePermitted: hasHardBlock ? false : !canGoLive,
    };
  }

  canLaunchWithOverride(
    report: ReadinessReport,
    supervisorOverride: boolean,
    supervisorReason: string,
  ): boolean {
    if (report.hardBlocks.length > 0) return false;
    if (report.canGoLive) return true;
    return (
      supervisorOverride &&
      supervisorReason.trim().length >= 8 &&
      report.supervisorOverridePermitted
    );
  }
}

export const readinessEngine = new ReadinessEngine();
