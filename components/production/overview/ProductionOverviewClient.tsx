"use client";

import OverviewDestinationsCard from "@/components/production/overview/OverviewDestinationsCard";
import {
  OverviewAlertsCard,
  OverviewSystemHealthCard,
} from "@/components/production/overview/OverviewHealthAlerts";
import OverviewKpiCards, { OverviewQuickActions } from "@/components/production/overview/OverviewKpiCards";
import OverviewLiveStreamsTable from "@/components/production/overview/OverviewLiveStreamsTable";
import OverviewMetricsChart from "@/components/production/overview/OverviewMetricsChart";
import OverviewRecentRecordings from "@/components/production/overview/OverviewRecentRecordings";
import {
  OverviewQueueCard,
  OverviewStorageCard,
  OverviewWorkerPoolCard,
} from "@/components/production/overview/OverviewWorkerQueueCard";
import type { useProductionDashboardMetrics } from "@/hooks/useProductionDashboardMetrics";

type ProductionOverviewClientProps = {
  metrics: ReturnType<typeof useProductionDashboardMetrics>;
  streamTitle?: string;
};

export default function ProductionOverviewClient({
  metrics,
  streamTitle = "300 Awakening Live",
}: ProductionOverviewClientProps) {
  const activeStreams = metrics.isLive ? 1 : metrics.stream?.primaryRtmpConfigured ? 1 : 0;
  const totalViewers = metrics.paidAttendees + metrics.recentChatCount10m;
  const avgBitrate =
    metrics.opsState?.bitrateKbps != null
      ? `${(metrics.opsState.bitrateKbps / 1000).toFixed(2)} Mbps`
      : "—";

  return (
    <div className="space-y-4 p-4 md:p-6">
      <OverviewQuickActions />

      <OverviewKpiCards
        metrics={metrics.metrics}
        activeStreams={activeStreams}
        totalViewers={totalViewers}
        avgBitrate={avgBitrate}
        workerCpu="—"
        storageUsed="—"
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <OverviewLiveStreamsTable
          stream={metrics.stream}
          opsState={metrics.opsState}
          streamTitle={streamTitle}
        />
        <OverviewMetricsChart
          latencyHistory={metrics.latencyHistory}
          droppedHistory={metrics.droppedHistory}
          bitrateKbps={metrics.opsState?.bitrateKbps ?? null}
          fps={metrics.opsState?.fps ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <OverviewDestinationsCard
          stream={metrics.stream}
          outputsActive={metrics.opsState?.outputsActive ?? 0}
          outputsTotal={metrics.opsState?.outputsTotal ?? 0}
        />
        <OverviewSystemHealthCard rows={metrics.systemHealth} />
        <OverviewAlertsCard alerts={metrics.alerts} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewWorkerPoolCard opsState={metrics.opsState} />
        <OverviewQueueCard />
        <OverviewStorageCard />
        <OverviewRecentRecordings />
      </div>
    </div>
  );
}
