"use client";

import type { OpsStreamTelemetryView } from "@/lib/broadcast/countdown-console-types";

type ResponsiveStatusStripProps = {
  opsStream: OpsStreamTelemetryView | null;
  variant: "desktop" | "mobile";
};

function MetricBox({
  label,
  value,
  alert = false,
  fault = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
  fault?: boolean;
}) {
  const tone = fault
    ? "border-red-500/70 text-red-400 motion-safe:animate-pulse"
    : alert
      ? "border-amber-500/40 text-amber-400 motion-safe:animate-pulse"
      : "border-brand-border text-zinc-300";

  return (
    <div className={`rounded-lg border bg-brand-black/50 p-2.5 ${tone}`}>
      <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-xs font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function ResponsiveStatusStrip({
  opsStream,
  variant,
}: ResponsiveStatusStripProps) {
  const dropped = opsStream?.droppedFramesPercent ?? 0;
  const latency = opsStream?.latencySeconds ?? 0;
  const droppedAlert = dropped > 1;
  const latencyAlert = latency > 4;
  const fatalError = opsStream?.fatalError ?? null;
  const ingestConnected = opsStream?.ingestStatus === "connected";

  const ingestLabel = ingestConnected
    ? "Connected"
    : opsStream?.ingestStatus === "error"
      ? "Error"
      : "Standby";

  const resolution = opsStream?.resolutionLabel ?? "—";
  const bitrate =
    opsStream?.bitrateMbps && opsStream.bitrateMbps > 0
      ? `${opsStream.bitrateMbps.toFixed(1)} Mbps`
      : "—";

  const stripClass = fatalError
    ? "border-red-500/70"
    : "border-brand-border";

  if (variant === "mobile") {
    return (
      <div className={`mx-3 rounded-lg border bg-brand-panel/60 p-2 ${stripClass}`}>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <MetricBox
            label="Ingest Port"
            value={`RTMP · ${ingestLabel}`}
            fault={Boolean(fatalError)}
            alert={ingestConnected}
          />
          <MetricBox label="Resolution" value={resolution} />
          <MetricBox
            label="Dropped Frames"
            value={`${dropped.toFixed(2)}%`}
            alert={droppedAlert}
            fault={Boolean(fatalError)}
          />
          <MetricBox
            label="Latency"
            value={`${latency.toFixed(1)}s`}
            alert={latencyAlert}
            fault={Boolean(fatalError)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-5 gap-2 rounded-xl border bg-brand-panel/40 p-3 ${stripClass}`}>
      <MetricBox
        label="Ingest Port"
        value={`RTMP 1935 · ${ingestLabel}`}
        alert={ingestConnected}
        fault={Boolean(fatalError)}
      />
      <MetricBox label="Resolution" value={resolution} />
      <MetricBox
        label="Dropped Frames"
        value={`${dropped.toFixed(2)}%`}
        alert={droppedAlert}
        fault={Boolean(fatalError)}
      />
      <MetricBox
        label="Latency"
        value={`${latency.toFixed(1)}s`}
        alert={latencyAlert}
        fault={Boolean(fatalError)}
      />
      <MetricBox label="Bitrate" value={bitrate} />
    </div>
  );
}
