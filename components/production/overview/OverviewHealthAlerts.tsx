"use client";

import type { ProductionAlert, SystemHealthRow, MetricStatus } from "@/lib/ops/production-dashboard-metrics";
import { cn } from "@/lib/utils";

function statusDot(status: MetricStatus): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-400";
    case "warning":
      return "bg-amber-400";
    case "critical":
      return "bg-brand-pink";
    default:
      return "bg-brand-muted";
  }
}

export function OverviewSystemHealthCard({ rows }: { rows: SystemHealthRow[] }) {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
        System Health
      </h2>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-black/30 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", statusDot(row.status))} aria-hidden="true" />
              <span className="font-body text-sm text-white">{row.label}</span>
            </div>
            <span className="font-mono text-xs text-brand-muted">{row.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OverviewAlertsCard({ alerts }: { alerts: ProductionAlert[] }) {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
        Alerts
      </h2>
      {alerts.length === 0 ? (
        <p className="font-body text-sm text-brand-muted">No active alerts</p>
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 5).map((alert) => (
            <li
              key={alert.id}
              className="rounded-lg border border-brand-border bg-brand-black/30 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-body text-sm text-white">{alert.title}</p>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-ui text-[0.45rem] font-bold uppercase tracking-[0.08em]",
                    alert.status === "critical" && "bg-brand-pink/15 text-brand-pink",
                    alert.status === "warning" && "bg-amber-500/15 text-amber-400",
                    alert.status === "healthy" && "bg-emerald-500/15 text-emerald-400",
                    alert.status === "neutral" && "bg-brand-black text-brand-muted",
                  )}
                >
                  {alert.status}
                </span>
              </div>
              <p className="mt-1 font-body text-xs text-brand-muted">{alert.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
