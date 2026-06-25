"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import AudioMonitorPanel from "@/components/ops/AudioMonitorPanel";
import LiveAttendeeSignalPanel from "@/components/ops/LiveAttendeeSignalPanel";
import ProductionAlertsPanel from "@/components/ops/ProductionAlertsPanel";
import ProductionMetricCards from "@/components/ops/ProductionMetricCards";
import ProductionPathBanner from "@/components/ops/ProductionPathBanner";
import StreamTelemetryPanel from "@/components/ops/StreamTelemetryPanel";
import SystemHealthPanel from "@/components/ops/SystemHealthPanel";
import OpsCameraSummaryGrid from "@/components/ops/production/OpsCameraSummaryGrid";
import OpsGlobalCountdownClock from "@/components/ops/production/OpsGlobalCountdownClock";
import OpsViewTabs from "@/components/ops/shell/OpsViewTabs";
import { useProductionDashboardMetrics } from "@/hooks/useProductionDashboardMetrics";
import {
  buildOpsModuleHref,
  normalizeOpsView,
  OPS_MODULE_ROUTES,
  OPS_PRODUCTION_DASHBOARD_VIEWS,
  type OpsProductionDashboardView,
} from "@/lib/ops/ops-module-nav";

type OpsProductionModuleClientProps = {
  operatorEmail: string;
};

function formatTimestamp(
  iso: string | null,
  fallback: Date | null,
  isLive: boolean,
  uptime: string,
): string {
  const value = iso ? new Date(iso) : fallback;
  if (!value || Number.isNaN(value.getTime())) {
    return isLive ? `Live · ${uptime}` : "Unavailable";
  }
  const formatted = value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return isLive ? `${formatted} · ${uptime}` : formatted;
}

function OpsProductionModuleInner({ operatorEmail }: OpsProductionModuleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeOpsView(
    searchParams.get("view"),
    OPS_PRODUCTION_DASHBOARD_VIEWS,
    "summary",
  );
  const metrics = useProductionDashboardMetrics(operatorEmail);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("view")) return;
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.productionDashboard, "summary"));
  }, [router, searchParams]);

  const viewTabs = OPS_PRODUCTION_DASHBOARD_VIEWS.map((id) => ({
    id,
    label: id,
    href: buildOpsModuleHref(OPS_MODULE_ROUTES.productionDashboard, id),
  }));

  const systemHealthy =
    metrics.opsState?.apiOk !== false && metrics.opsState?.pullEngineStatus !== "error";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ProductionPathBanner isLive={metrics.isLive} />

      <header className="shrink-0 border-b border-brand-border bg-brand-black/90 px-4 py-4 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-headline text-fluid-section uppercase tracking-[0.1em]">
              Production Dashboard
            </h1>
            <p className="mt-1 font-body text-sm text-brand-muted">
              Read-only overview · {systemHealthy ? "Systems nominal" : "Attention required"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] ${
                metrics.isLive
                  ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
                  : "border-brand-border bg-brand-panel text-brand-muted"
              }`}
            >
              {metrics.isLive ? "Live" : "Standby"}
            </span>
            <button
              type="button"
              onClick={() => void metrics.refresh()}
              disabled={metrics.isRefreshing}
              aria-label="Refresh metrics"
              className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-panel text-brand-blue disabled:opacity-60"
            >
              {metrics.isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <span className="font-mono text-[0.62rem] text-brand-muted" key={metrics.telemetryRevision}>
              {mounted
                ? formatTimestamp(
                    metrics.lastUpdated,
                    metrics.lastRefreshedAt,
                    metrics.isLive,
                    metrics.opsState?.uptime ?? "00:00:00",
                  )
                : "—"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <OpsViewTabs tabs={viewTabs} activeId={view} ariaLabel="Production dashboard views" />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
          {view === "summary" ? (
            <>
              <ProductionMetricCards metrics={metrics.metrics} />
              <OpsGlobalCountdownClock />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="xl:col-span-8">
                  <StreamTelemetryPanel
                    rows={metrics.telemetryRows}
                    latencyHistory={metrics.latencyHistory}
                    droppedHistory={metrics.droppedHistory}
                  />
                </div>
                <div className="xl:col-span-4">
                  <AudioMonitorPanel audioLevels={metrics.opsState?.audioLevels ?? null} />
                </div>
              </div>
              <OpsCameraSummaryGrid stream={metrics.stream} />
            </>
          ) : null}

          {view === "alerts" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ProductionAlertsPanel alerts={metrics.alerts} />
              <SystemHealthPanel rows={metrics.systemHealth} />
              <div className="lg:col-span-2">
                <StreamTelemetryPanel
                  rows={metrics.telemetryRows}
                  latencyHistory={metrics.latencyHistory}
                  droppedHistory={metrics.droppedHistory}
                />
              </div>
            </div>
          ) : null}

          {view === "chat" ? (
            <LiveAttendeeSignalPanel
              troubleCount={metrics.troubleCount}
              audioIssueCount={metrics.audioIssueCount}
              videoIssueCount={metrics.videoIssueCount}
              paidAttendees={metrics.paidAttendees}
              recentChatCount10m={metrics.recentChatCount10m}
              recentMessages={metrics.recentMessages}
            />
          ) : null}

          {view === "logs" ? (
            <div className="glass-panel overflow-hidden rounded-2xl border border-brand-border">
              <ul className="divide-y divide-brand-border">
                {(metrics.snapshot?.accessLogs ?? []).slice(0, 20).length === 0 ? (
                  <li className="p-6 font-body text-sm text-brand-muted">No access log entries yet.</li>
                ) : (
                  (metrics.snapshot?.accessLogs ?? []).slice(0, 20).map((log) => (
                    <li
                      key={log.id}
                      className="flex flex-col gap-1 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">
                          {log.result}
                        </p>
                        <p className="mt-1 font-body text-xs text-brand-muted">
                          {log.reason || "—"}
                        </p>
                      </div>
                      <p className="font-ui text-[0.52rem] uppercase tracking-[0.1em] text-brand-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function OpsProductionModuleClient(props: OpsProductionModuleClientProps) {
  return (
    <Suspense fallback={null}>
      <OpsProductionModuleInner {...props} />
    </Suspense>
  );
}
