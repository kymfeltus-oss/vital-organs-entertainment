import type { SystemHealthRow } from "@/lib/ops/production-dashboard-metrics";
import { statusDotClass } from "@/lib/ops/production-dashboard-metrics";

type SystemHealthPanelProps = {
  rows: SystemHealthRow[];
};

function statusLabel(status: SystemHealthRow["status"]): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "critical":
      return "Critical";
    default:
      return "Unavailable";
  }
}

export default function SystemHealthPanel({ rows }: SystemHealthPanelProps) {
  return (
    <section
      id="logs"
      className="glass-panel rounded-2xl border border-brand-border p-4 md:p-5"
    >
      <header className="mb-4 border-b border-brand-border pb-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white">
          System Health
        </h2>
      </header>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-brand-border/70 bg-brand-black/30 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(row.status)}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white">
                  {row.label}
                </p>
                <p className="truncate font-body text-[0.62rem] text-brand-muted">{row.detail}</p>
              </div>
            </div>
            <span className="shrink-0 font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-brand-muted">
              {statusLabel(row.status)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
