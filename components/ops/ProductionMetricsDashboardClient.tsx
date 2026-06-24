"use client";

import { Loader2, RefreshCw } from "lucide-react";
import AudioMonitorPanel from "@/components/ops/AudioMonitorPanel";
import LiveAttendeeSignalPanel from "@/components/ops/LiveAttendeeSignalPanel";
import ProductionAlertsPanel from "@/components/ops/ProductionAlertsPanel";
import ProductionDashboardSidebar from "@/components/ops/ProductionDashboardSidebar";
import ProductionMetricCards from "@/components/ops/ProductionMetricCards";
import ProductionPathBanner from "@/components/ops/ProductionPathBanner";
import ReadOnlyDashboardNotice from "@/components/ops/ReadOnlyDashboardNotice";
import StreamTelemetryPanel from "@/components/ops/StreamTelemetryPanel";
import SystemHealthPanel from "@/components/ops/SystemHealthPanel";
import { useProductionDashboardMetrics } from "@/hooks/useProductionDashboardMetrics";

type ProductionMetricsDashboardClientProps = {
  operatorEmail: string;
};

function formatTimestamp(iso: string | null, fallback: Date | null): string {
  const value = iso ? new Date(iso) : fallback;
  if (!value || Number.isNaN(value.getTime())) return "Unavailable";
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ProductionMetricsDashboardClient({
  operatorEmail,
}: ProductionMetricsDashboardClientProps) {
  const metrics = useProductionDashboardMetrics(operatorEmail);
  const systemHealthy =
    metrics.opsState?.apiOk !== false && metrics.opsState?.pullEngineStatus !== "error";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-brand-black text-white md:h-screen">
      <ProductionPathBanner isLive={metrics.isLive} />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ProductionDashboardSidebar
          uptime={metrics.opsState?.uptime ?? "00:00:00"}
          systemHealthy={systemHealthy}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">
          <header className="shrink-0 border-b border-brand-border bg-brand-black/90 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-headline text-fluid-section uppercase tracking-[0.1em]">
                  Production Metrics Dashboard
                </h1>
                <p className="mt-1 max-w-2xl font-body text-sm text-brand-muted">
                  Real-time overview of live production health and performance
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span
                  className={`rounded-full border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] ${
                    metrics.isLive
                      ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
                      : "border-brand-border bg-brand-panel text-brand-muted"
                  }`}
                >
                  {metrics.isLive ? "Live" : "Standby"}
                </span>

                <span className="rounded-full border border-brand-border bg-brand-panel px-3 py-1 font-ui text-[0.52rem] uppercase tracking-[0.1em] text-brand-muted">
                  Role:{" "}
                  <span className="font-bold text-white">{metrics.roleDisplay}</span>
                </span>

                <span className="font-mono text-[0.62rem] text-brand-muted">
                  Updated {formatTimestamp(metrics.lastUpdated, metrics.lastRefreshedAt)}
                </span>

                <button
                  type="button"
                  onClick={() => void metrics.refresh()}
                  disabled={metrics.isRefreshing}
                  aria-label="Refresh metrics"
                  className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-panel text-brand-blue transition hover:border-brand-blue/40 disabled:opacity-60"
                >
                  {metrics.isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/10 font-ui text-[0.52rem] font-bold uppercase text-brand-blue"
                  aria-label={`Profile ${metrics.profileInitials}`}
                  title={operatorEmail}
                >
                  {metrics.profileInitials}
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
              <ProductionMetricCards metrics={metrics.metrics} />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="xl:col-span-7">
                  <StreamTelemetryPanel
                    rows={metrics.telemetryRows}
                    latencyHistory={metrics.latencyHistory}
                    droppedHistory={metrics.droppedHistory}
                  />
                </div>
                <div className="xl:col-span-5">
                  <AudioMonitorPanel audioLevels={metrics.opsState?.audioLevels ?? null} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ProductionAlertsPanel alerts={metrics.alerts} />
                <LiveAttendeeSignalPanel
                  troubleCount={metrics.troubleCount}
                  audioIssueCount={metrics.audioIssueCount}
                  videoIssueCount={metrics.videoIssueCount}
                  paidAttendees={metrics.paidAttendees}
                  recentChatCount10m={metrics.recentChatCount10m}
                  recentMessages={metrics.recentMessages}
                />
                <SystemHealthPanel rows={metrics.systemHealth} />
              </div>

              <ReadOnlyDashboardNotice />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
