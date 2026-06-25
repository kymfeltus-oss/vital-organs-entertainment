"use client";

type OverviewMetricsChartProps = {
  latencyHistory: number[];
  droppedHistory: number[];
  bitrateKbps: number | null;
  fps: number;
};

function buildPath(values: number[], width: number, height: number, max: number): string {
  if (values.length === 0) return "";
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function OverviewMetricsChart({
  latencyHistory,
  droppedHistory,
  bitrateKbps,
  fps,
}: OverviewMetricsChartProps) {
  const width = 480;
  const height = 120;
  const latencyPath = buildPath(latencyHistory, width, height, Math.max(...latencyHistory, 5, 1));
  const droppedPath = buildPath(droppedHistory, width, height, Math.max(...droppedHistory, 2, 0.1));

  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          Realtime Metrics
        </h2>
        <span className="font-body text-xs text-brand-muted">Last 5 min window</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 font-body text-xs">
        <span className="flex items-center gap-1.5 text-brand-blue">
          <span className="h-0.5 w-4 bg-brand-blue" aria-hidden="true" />
          Latency (s)
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="h-0.5 w-4 bg-amber-400" aria-hidden="true" />
          Dropped (%)
        </span>
        {bitrateKbps != null ? (
          <span className="text-brand-muted">Bitrate {bitrateKbps} kbps</span>
        ) : null}
        {fps > 0 ? <span className="text-brand-muted">FPS {fps}</span> : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-black/50 p-2">
        {latencyHistory.length === 0 && droppedHistory.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center font-body text-xs text-brand-muted">
            Telemetry appears when the stream is live
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[120px] w-full" aria-hidden="true">
            <path d={latencyPath} fill="none" stroke="#00f2ff" strokeWidth="2" />
            <path d={droppedPath} fill="none" stroke="#fbbf24" strokeWidth="2" />
          </svg>
        )}
      </div>
    </section>
  );
}
