"use client";

import type { OpsStreamTelemetryView } from "@/lib/broadcast/countdown-console-types";

type ResponsiveStatusStripProps = {
  opsStream: OpsStreamTelemetryView | null;
  variant: "desktop" | "mobile";
};

type MetricStatus = "healthy" | "warning" | "critical" | "neutral";

function MetricBox({
  label,
  value,
  statusLabel,
  status = "neutral",
}: {
  label: string;
  value: string;
  statusLabel: string;
  status?: MetricStatus;
}) {
  const tone =
    status === "critical"
      ? "border-red-500/70 text-red-400 motion-safe:animate-pulse"
      : status === "warning"
        ? "border-amber-500/40 text-amber-400 motion-safe:animate-pulse"
        : status === "healthy"
          ? "border-emerald-500/30 text-emerald-400"
          : "border-brand-border text-white";

  return (
    <div className={`rounded-lg border bg-brand-black/50 p-2.5 ${tone}`}>
      <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-xs font-bold tabular-nums">{value}</p>
      <p className="mt-1 font-ui text-[0.46rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
        {statusLabel}
      </p>
    </div>
  );
}

export default function ResponsiveStatusStrip({
  opsStream,
  variant,
}: ResponsiveStatusStripProps) {
  const dropped = opsStream?.droppedFramesPercent ?? 0;
  const latency = opsStream?.latencySeconds ?? 0;
  const droppedWarning = dropped > 1;
  const latencyWarning = latency > 4;
  const fatalError = opsStream?.fatalError ?? null;
  const ingestConnected = opsStream?.ingestStatus === "connected";
  const ingestError = opsStream?.ingestStatus === "error";

  const ingestStatus: MetricStatus = fatalError || ingestError
    ? "critical"
    : ingestConnected
      ? "healthy"
      : "warning";

  const droppedStatus: MetricStatus = fatalError
    ? "critical"
    : droppedWarning
      ? "warning"
      : dropped > 0
        ? "healthy"
        : "neutral";

  const latencyStatus: MetricStatus = fatalError
    ? "critical"
    : latencyWarning
      ? "warning"
      : latency > 0
        ? "healthy"
        : "neutral";

  const resolution = opsStream?.resolutionLabel ?? "—";
  const bitrateMbps = opsStream?.bitrateMbps;
  const bitrate =
    bitrateMbps != null && bitrateMbps > 0
      ? `${bitrateMbps.toFixed(1)} Mbps`
      : "—";

  const bitrateStatus: MetricStatus =
    bitrateMbps != null && bitrateMbps > 0 ? "healthy" : "neutral";

  const stripClass = fatalError ? "border-red-500/70" : "border-brand-border";

  if (variant === "mobile") {
    return (
      <div className={`rounded-lg border bg-brand-panel/60 p-2 ${stripClass}`}>
        <div className="grid grid-cols-2 gap-2">
          <MetricBox
            label="Ingest Port"
            value="RTMP 1935"
            statusLabel={
              ingestStatus === "critical"
                ? "Critical"
                : ingestConnected
                  ? "Connected"
                  : "Warning"
            }
            status={ingestStatus}
          />
          <MetricBox
            label="Dropped Frames"
            value={`${dropped.toFixed(2)}%`}
            statusLabel={
              droppedStatus === "critical"
                ? "Critical"
                : droppedWarning
                  ? "Warning"
                  : "Good"
            }
            status={droppedStatus}
          />
          <MetricBox
            label="Latency"
            value={`${latency.toFixed(1)}s`}
            statusLabel={
              latencyStatus === "critical"
                ? "Critical"
                : latencyWarning
                  ? "Warning"
                  : "Good"
            }
            status={latencyStatus}
          />
          <MetricBox
            label="Bitrate"
            value={bitrate}
            statusLabel={bitrateStatus === "healthy" ? "Stable" : "—"}
            status={bitrateStatus}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-5 gap-2 rounded-xl border bg-brand-panel/40 p-3 ${stripClass}`}>
      <MetricBox
        label="Ingest Port"
        value={`RTMP 1935 · ${ingestConnected ? "Connected" : ingestError ? "Error" : "Standby"}`}
        statusLabel={
          ingestStatus === "critical" ? "Critical" : ingestConnected ? "Connected" : "Warning"
        }
        status={ingestStatus}
      />
      <MetricBox label="Resolution" value={resolution} statusLabel="Clear HD" status="neutral" />
      <MetricBox
        label="Dropped Frames"
        value={`${dropped.toFixed(2)}%`}
        statusLabel={droppedWarning ? "Warning" : "Good"}
        status={droppedStatus}
      />
      <MetricBox
        label="Latency"
        value={`${latency.toFixed(1)}s`}
        statusLabel={latencyWarning ? "Warning" : "Good"}
        status={latencyStatus}
      />
      <MetricBox
        label="Bitrate"
        value={bitrate}
        statusLabel={bitrateStatus === "healthy" ? "Stable" : "—"}
        status={bitrateStatus}
      />
    </div>
  );
}
