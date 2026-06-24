"use client";

import type { OpsStreamState } from "@/lib/ops/ops-stream-state";

type CountdownMobileTelemetryStripProps = {
  opsState: OpsStreamState | null;
};

function MetricCell({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-brand-black/50 p-2.5 ${
        alert ? "border-amber-500/40" : "border-brand-border"
      }`}
    >
      <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-xs font-bold tabular-nums ${
          alert ? "text-amber-400 motion-safe:animate-pulse" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Compact 2-column stream health grid for countdown ops mobile. */
export default function CountdownMobileTelemetryStrip({
  opsState,
}: CountdownMobileTelemetryStripProps) {
  const droppedFrames = opsState?.droppedFramesPercent ?? 0;
  const latencySeconds = opsState?.latencySeconds ?? 0;
  const fps = opsState?.fps ?? 0;
  const isLive = opsState?.isLive === true;

  const droppedAlert = droppedFrames > 1;
  const latencyAlert = latencySeconds > 4;

  return (
    <div className="border-b border-brand-border bg-brand-panel/40 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          Stream Health
        </p>
        <span
          className={`rounded-full border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] ${
            isLive
              ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
              : "border-brand-purple/40 bg-brand-purple/10 text-brand-purple"
          }`}
        >
          {isLive ? "Live" : "Rehearsal"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Ingest Port" value="RTMP 1935" />
        <MetricCell
          label="Latency"
          value={`${latencySeconds.toFixed(1)}s`}
          alert={latencyAlert}
        />
        <MetricCell
          label="Dropped Frames"
          value={`${droppedFrames.toFixed(2)}%`}
          alert={droppedAlert}
        />
        <MetricCell label="Frame Rate" value={`${fps.toFixed(0)} fps`} />
      </div>
    </div>
  );
}
