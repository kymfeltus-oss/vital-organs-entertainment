import MetricSparkline from "@/components/ops/MetricSparkline";
import type { TelemetryRow } from "@/lib/ops/production-dashboard-metrics";
import { statusDotClass } from "@/lib/ops/production-dashboard-metrics";

type StreamTelemetryPanelProps = {
  rows: TelemetryRow[];
  latencyHistory: number[];
  droppedHistory: number[];
};

export default function StreamTelemetryPanel({
  rows,
  latencyHistory,
  droppedHistory,
}: StreamTelemetryPanelProps) {
  return (
    <section
      id="stream-health"
      className="glass-panel flex h-full flex-col rounded-2xl border border-brand-border p-4 md:p-5"
    >
      <header className="mb-4 border-b border-brand-border pb-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-blue">
          Stream Telemetry
        </h2>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-brand-border bg-brand-black/40 p-3">
          <p className="font-ui text-[0.48rem] uppercase tracking-[0.12em] text-brand-muted">
            Latency trend
          </p>
          <MetricSparkline samples={latencyHistory} label="Latency" />
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-black/40 p-3">
          <p className="font-ui text-[0.48rem] uppercase tracking-[0.12em] text-brand-muted">
            Dropped frames trend
          </p>
          <MetricSparkline
            samples={droppedHistory}
            strokeClass="stroke-brand-pink"
            label="Dropped frames"
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-brand-border/70 bg-brand-black/30 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(row.status)}`}
                aria-hidden="true"
              />
              <span className="font-ui text-[0.52rem] uppercase tracking-[0.1em] text-brand-muted">
                {row.label}
              </span>
            </div>
            <span className="truncate font-mono text-[0.68rem] text-white">{row.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
