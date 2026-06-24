import type { OpsStreamState } from "@/lib/ops/ops-stream-state";
import { isMasterAudioSilent } from "@/lib/ops/ops-stream-state";
import type { OpsSnapshot } from "@/lib/ops/types";

export type MetricStatus = "healthy" | "warning" | "critical" | "neutral";

export type ProductionMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  status: MetricStatus;
};

export type ProductionAlert = {
  id: string;
  title: string;
  detail: string;
  status: MetricStatus;
  timestamp?: string;
};

export type SystemHealthRow = {
  id: string;
  label: string;
  status: MetricStatus;
  detail: string;
};

export type TelemetryRow = {
  label: string;
  value: string;
  status: MetricStatus;
};

export type AttendeeRecentMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

const UNAVAILABLE = "Unavailable";

function ingestStatusLabel(
  stream: OpsSnapshot["stream"] | null,
  opsState: OpsStreamState | null,
): { label: string; status: MetricStatus } {
  if (!stream || !opsState) {
    return { label: UNAVAILABLE, status: "neutral" };
  }
  if (!opsState.apiOk) {
    return { label: "Error", status: "critical" };
  }
  if (stream.primaryRtmpConfigured || stream.primaryRtmpPullConfigured) {
    return {
      label: opsState.isLive ? "Connected" : "Configured",
      status: opsState.isLive ? "healthy" : "neutral",
    };
  }
  return { label: "Not configured", status: "warning" };
}

function streamStatusLabel(opsState: OpsStreamState | null): {
  label: string;
  status: MetricStatus;
} {
  if (!opsState) return { label: UNAVAILABLE, status: "neutral" };
  if (opsState.isLive) return { label: "LIVE", status: "healthy" };
  return { label: "STANDBY", status: "neutral" };
}

function latencyStatus(latencySeconds: number, available: boolean): MetricStatus {
  if (!available) return "neutral";
  if (latencySeconds > 4) return "warning";
  return latencySeconds > 0 ? "healthy" : "neutral";
}

function droppedStatus(droppedFramesPercent: number, available: boolean): MetricStatus {
  if (!available) return "neutral";
  if (droppedFramesPercent > 1) return "warning";
  return "healthy";
}

function outputsStatus(outputsActive: number, outputsTotal: number): MetricStatus {
  if (outputsTotal <= 0) return "neutral";
  if (outputsActive < outputsTotal) return "warning";
  if (outputsActive === outputsTotal && outputsActive > 0) return "healthy";
  return "neutral";
}

function telemetryAvailable(opsState: OpsStreamState | null): boolean {
  return Boolean(opsState?.isLive && opsState.encoderTelemetryAvailable);
}

function audioProcessingStatus(opsState: OpsStreamState | null): MetricStatus {
  if (!opsState?.isLive) return "neutral";
  if (isMasterAudioSilent(opsState)) return "warning";
  return "healthy";
}

function pullEngineMetricStatus(pullEngineStatus: OpsStreamState["pullEngineStatus"]): MetricStatus {
  if (pullEngineStatus === "error") return "critical";
  if (pullEngineStatus === "running") return "healthy";
  return "neutral";
}

export function buildProductionMetricCards(
  stream: OpsSnapshot["stream"] | null,
  opsState: OpsStreamState | null,
): ProductionMetric[] {
  const streamStatus = streamStatusLabel(opsState);
  const ingest = ingestStatusLabel(stream, opsState);
  const hasTelemetry = telemetryAvailable(opsState);
  const latency = opsState?.latencySeconds ?? 0;
  const dropped = opsState?.droppedFramesPercent ?? 0;
  const outputsActive = opsState?.outputsActive ?? 0;
  const outputsTotal = opsState?.outputsTotal ?? 0;
  const bitrateKbps = opsState?.bitrateKbps ?? null;

  return [
    {
      id: "stream-status",
      label: "Stream Status",
      value: streamStatus.label,
      helper: opsState?.isLive ? "Broadcast path active" : "Awaiting go-live",
      status: streamStatus.status,
    },
    {
      id: "ingest-status",
      label: "Ingest Status",
      value: ingest.label,
      helper: stream?.primaryRtmpConfigured
        ? "Primary RTMP configured"
        : "Configure ingest in Broadcast Desk",
      status: ingest.status,
    },
    {
      id: "latency",
      label: "Latency",
      value: hasTelemetry ? `${latency.toFixed(1)}s` : UNAVAILABLE,
      helper: hasTelemetry ? "End-to-end encoder delay" : "No live telemetry",
      status: latencyStatus(latency, hasTelemetry),
    },
    {
      id: "dropped-frames",
      label: "Dropped Frames",
      value: hasTelemetry ? `${dropped.toFixed(1)}%` : UNAVAILABLE,
      helper: hasTelemetry ? "Packet / frame loss" : "No live telemetry",
      status: droppedStatus(dropped, hasTelemetry),
    },
    {
      id: "bitrate",
      label: "Bitrate",
      value: hasTelemetry && bitrateKbps != null ? `${bitrateKbps} kbps` : UNAVAILABLE,
      helper:
        hasTelemetry && bitrateKbps != null
          ? "Encoder uplink bitrate"
          : "Connect Broadcast Desk telemetry for bitrate",
      status: hasTelemetry && bitrateKbps != null ? "healthy" : "neutral",
    },
    {
      id: "resolution",
      label: "Resolution",
      value:
        hasTelemetry && opsState && opsState.videoResolution !== "—"
          ? opsState.videoResolution
          : UNAVAILABLE,
      helper: hasTelemetry ? "Program output" : "Stream offline or telemetry unavailable",
      status: hasTelemetry ? "healthy" : "neutral",
    },
    {
      id: "outputs-active",
      label: "Outputs Active",
      value:
        outputsTotal > 0 ? `${outputsActive}/${outputsTotal}` : UNAVAILABLE,
      helper: "Restream output lanes provisioned",
      status: outputsStatus(outputsActive, outputsTotal),
    },
    {
      id: "api-status",
      label: "API Status",
      value: opsState ? (opsState.apiOk ? "Online" : "Degraded") : UNAVAILABLE,
      helper: opsState?.apiOk ? "Ops stream services reachable" : "Verify Restream / engine",
      status: opsState?.apiOk === false ? "critical" : opsState ? "healthy" : "neutral",
    },
  ];
}

export function buildTelemetryRows(
  stream: OpsSnapshot["stream"] | null,
  opsState: OpsStreamState | null,
): TelemetryRow[] {
  const ingest = ingestStatusLabel(stream, opsState);
  const pullStatus = pullEngineMetricStatus(opsState?.pullEngineStatus ?? "stopped");
  const hasTelemetry = telemetryAvailable(opsState);
  const bitrateKbps = opsState?.bitrateKbps ?? null;

  return [
    { label: "Ingest State", value: ingest.label, status: ingest.status },
    {
      label: "Pull Engine",
      value: opsState?.pullEngineStatus ?? UNAVAILABLE,
      status: pullStatus,
    },
    {
      label: "Resolution",
      value:
        hasTelemetry && opsState && opsState.videoResolution !== "—"
          ? opsState.videoResolution
          : UNAVAILABLE,
      status: hasTelemetry ? "healthy" : "neutral",
    },
    {
      label: "FPS",
      value: hasTelemetry && opsState && opsState.fps > 0 ? `${opsState.fps.toFixed(2)}` : UNAVAILABLE,
      status: hasTelemetry && opsState && opsState.fps > 0 ? "healthy" : "neutral",
    },
    {
      label: "Bitrate",
      value: hasTelemetry && bitrateKbps != null ? `${bitrateKbps} kbps` : UNAVAILABLE,
      status: hasTelemetry && bitrateKbps != null ? "healthy" : "neutral",
    },
    {
      label: "Latency",
      value: hasTelemetry && opsState ? `${opsState.latencySeconds.toFixed(1)}s` : UNAVAILABLE,
      status: latencyStatus(opsState?.latencySeconds ?? 0, hasTelemetry),
    },
    {
      label: "Dropped Frames",
      value:
        hasTelemetry && opsState
          ? `${opsState.droppedFramesPercent.toFixed(1)}%`
          : UNAVAILABLE,
      status: droppedStatus(opsState?.droppedFramesPercent ?? 0, hasTelemetry),
    },
    {
      label: "Uptime",
      value: opsState?.isLive ? opsState.uptime : UNAVAILABLE,
      status: opsState?.isLive ? "healthy" : "neutral",
    },
    {
      label: "Last Heartbeat",
      value: stream?.lastMobilePingAt ?? stream?.updatedAt ?? UNAVAILABLE,
      status: stream?.updatedAt ? "healthy" : "neutral",
    },
    {
      label: "Outputs Active",
      value:
        opsState && opsState.outputsTotal > 0
          ? `${opsState.outputsActive}/${opsState.outputsTotal}`
          : UNAVAILABLE,
      status: outputsStatus(opsState?.outputsActive ?? 0, opsState?.outputsTotal ?? 0),
    },
  ];
}

export function buildProductionAlerts(
  stream: OpsSnapshot["stream"] | null,
  opsState: OpsStreamState | null,
): ProductionAlert[] {
  const alerts: ProductionAlert[] = [];
  const timestamp = stream?.updatedAt ?? undefined;
  const hasTelemetry = telemetryAvailable(opsState);

  if (hasTelemetry && (opsState?.latencySeconds ?? 0) > 4) {
    alerts.push({
      id: "high-latency",
      title: "High Latency",
      detail: `Encoder latency at ${opsState!.latencySeconds.toFixed(1)}s (threshold 4s).`,
      status: "warning",
      timestamp,
    });
  }

  if (hasTelemetry && (opsState?.droppedFramesPercent ?? 0) > 1) {
    alerts.push({
      id: "dropped-frames",
      title: "Dropped Frames High",
      detail: `Frame loss at ${opsState!.droppedFramesPercent.toFixed(1)}% (threshold 1%).`,
      status: "warning",
      timestamp,
    });
  }

  if (opsState && !opsState.apiOk) {
    alerts.push({
      id: "api-disconnected",
      title: "API Disconnected",
      detail: "Ops stream API or Restream lanes are not fully provisioned.",
      status: "critical",
      timestamp,
    });
  }

  if (
    opsState &&
    opsState.outputsTotal > 0 &&
    opsState.outputsActive < opsState.outputsTotal
  ) {
    alerts.push({
      id: "outputs-missing",
      title: "Outputs Missing",
      detail: `${opsState.outputsActive} of ${opsState.outputsTotal} Restream lanes active.`,
      status: "warning",
      timestamp,
    });
  }

  if (opsState?.pullEngineStatus === "error") {
    alerts.push({
      id: "stream-engine-error",
      title: "Stream Engine",
      detail: "Pull engine reported an error — verify HLS / Restream pull URL.",
      status: "critical",
      timestamp,
    });
  }

  if (isMasterAudioSilent(opsState)) {
    alerts.push({
      id: "audio-silent",
      title: "Audio Silent",
      detail: "Master audio meter is below floor while live — verify program audio path.",
      status: "warning",
      timestamp,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "no-active-alerts",
      title: "No Active Conditions",
      detail: "Monitoring telemetry — no warning thresholds exceeded.",
      status: "neutral",
      timestamp,
    });
  }

  return alerts;
}

export function buildSystemHealthRows(
  stream: OpsSnapshot["stream"] | null,
  opsState: OpsStreamState | null,
): SystemHealthRow[] {
  const ingest = ingestStatusLabel(stream, opsState);
  const pullStatus = pullEngineMetricStatus(opsState?.pullEngineStatus ?? "stopped");
  const outputs = outputsStatus(opsState?.outputsActive ?? 0, opsState?.outputsTotal ?? 0);
  const audioStatus = audioProcessingStatus(opsState);

  return [
    {
      id: "stream-engine",
      label: "Stream Engine",
      status: pullStatus,
      detail: opsState?.pullEngineStatus ?? UNAVAILABLE,
    },
    {
      id: "ingest-connection",
      label: "Ingest Connection",
      status: ingest.status,
      detail: ingest.label,
    },
    {
      id: "pull-engine",
      label: "Pull Engine",
      status: pullStatus,
      detail: opsState?.pullEngineStatus ?? UNAVAILABLE,
    },
    {
      id: "output-destinations",
      label: "Output Destinations",
      status: outputs,
      detail:
        opsState && opsState.outputsTotal > 0
          ? `${opsState.outputsActive}/${opsState.outputsTotal} lanes`
          : UNAVAILABLE,
    },
    {
      id: "api-services",
      label: "API Services",
      status: opsState?.apiOk === false ? "critical" : opsState ? "healthy" : "neutral",
      detail: opsState?.apiOk ? "Reachable" : UNAVAILABLE,
    },
    {
      id: "database",
      label: "Database",
      status: stream?.updatedAt ? "healthy" : "neutral",
      detail: stream?.updatedAt ? "Stream state synced" : UNAVAILABLE,
    },
    {
      id: "audio-processing",
      label: "Audio Processing",
      status: audioStatus,
      detail:
        audioStatus === "warning"
          ? "Master audio below floor"
          : audioStatus === "healthy"
            ? "Master audio passing"
            : UNAVAILABLE,
    },
  ];
}

export function statusAccentClass(status: MetricStatus): string {
  switch (status) {
    case "healthy":
      return "text-brand-blue border-brand-blue/30 bg-brand-blue/10";
    case "warning":
      return "text-amber-300 border-amber-400/30 bg-amber-400/10";
    case "critical":
      return "text-brand-pink border-brand-pink/40 bg-brand-pink/10";
    default:
      return "text-brand-muted border-brand-border bg-brand-panel/60";
  }
}

export function statusDotClass(status: MetricStatus): string {
  switch (status) {
    case "healthy":
      return "bg-brand-blue shadow-[0_0_8px_#00A8FF]";
    case "warning":
      return "bg-amber-400 shadow-[0_0_8px_#fbbf24]";
    case "critical":
      return "bg-brand-pink shadow-[0_0_8px_#FF2FAF]";
    default:
      return "bg-brand-muted/50";
  }
}
