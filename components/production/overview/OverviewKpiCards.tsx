"use client";

import Link from "next/link";
import type { ProductionMetric, MetricStatus } from "@/lib/ops/production-dashboard-metrics";
import { cn } from "@/lib/utils";
import {
  Activity,
  HardDrive,
  Radio,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

type OverviewKpiCardsProps = {
  metrics: ProductionMetric[];
  activeStreams: number;
  totalViewers: number;
  avgBitrate: string;
  workerCpu: string;
  storageUsed: string;
};

const KPI_ICONS = [Video, Users, Activity, TrendingDown, HardDrive, Radio];

function statusTrend(status: MetricStatus): "up" | "down" | "neutral" {
  if (status === "healthy") return "up";
  if (status === "critical" || status === "warning") return "down";
  return "neutral";
}

function KpiCard({
  label,
  value,
  helper,
  status,
  iconIndex,
}: {
  label: string;
  value: string;
  helper: string;
  status: MetricStatus;
  iconIndex: number;
}) {
  const Icon = KPI_ICONS[iconIndex] ?? Activity;
  const trend = statusTrend(status);

  return (
    <article className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-muted">
          {label}
        </p>
        <span className="rounded-lg border border-brand-border bg-brand-black/40 p-1.5 text-brand-blue">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="font-headline text-2xl tracking-[0.04em] text-white">{value}</p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1 font-body text-xs",
          trend === "up" && "text-emerald-400",
          trend === "down" && "text-brand-pink",
          trend === "neutral" && "text-brand-muted",
        )}
      >
        {trend === "up" ? (
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
        ) : trend === "down" ? (
          <TrendingDown className="h-3 w-3" aria-hidden="true" />
        ) : null}
        {helper}
      </p>
    </article>
  );
}

export default function OverviewKpiCards({
  metrics,
  activeStreams,
  totalViewers,
  avgBitrate,
  workerCpu,
  storageUsed,
}: OverviewKpiCardsProps) {
  const cards = [
    {
      label: "Active Streams",
      value: String(activeStreams),
      helper: activeStreams > 0 ? "Live broadcast active" : "No live streams",
      status: (activeStreams > 0 ? "healthy" : "neutral") as MetricStatus,
    },
    {
      label: "Total Viewers (Live)",
      value: totalViewers.toLocaleString(),
      helper: "Paid passes + chat activity",
      status: (totalViewers > 0 ? "healthy" : "neutral") as MetricStatus,
    },
    {
      label: "Avg Bitrate",
      value: avgBitrate,
      helper: metrics.find((m) => m.id === "bitrate")?.helper ?? "Encoder telemetry",
      status: (metrics.find((m) => m.id === "bitrate")?.status ?? "neutral") as MetricStatus,
    },
    {
      label: "Dropped Frames",
      value: metrics.find((m) => m.id === "dropped-frames")?.value ?? "—",
      helper: metrics.find((m) => m.id === "dropped-frames")?.helper ?? "Packet loss",
      status: (metrics.find((m) => m.id === "dropped-frames")?.status ?? "neutral") as MetricStatus,
    },
    {
      label: "CPU (Workers)",
      value: workerCpu,
      helper: "Worker pool not connected",
      status: "neutral" as MetricStatus,
    },
    {
      label: "Storage (S3)",
      value: storageUsed,
      helper: "Object storage not connected",
      status: "neutral" as MetricStatus,
    },
  ];

  return (
    <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card, index) => (
        <KpiCard key={card.label} {...card} iconIndex={index} />
      ))}
    </section>
  );
}

export function OverviewQuickActions() {
  const actions = [
    { label: "Pre Show Setup", href: "/production/preshow", primary: true },
    { label: "Broadcast Studio", href: "/production/broadcast-studio", primary: false },
    { label: "Create Stream", href: "/production/streams", primary: false },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            "touch-target rounded-lg px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] transition",
            action.primary
              ? "parable-btn-cyan rounded-lg px-4 py-2 font-ui text-[0.55rem]"
              : "border border-brand-border bg-brand-panel text-brand-muted hover:text-white",
          )}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
