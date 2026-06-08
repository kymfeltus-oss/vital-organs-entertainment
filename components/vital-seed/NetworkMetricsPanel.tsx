"use client";

import { motion } from "framer-motion";
import {
  HARVEST_GOAL_DOLLARS,
  LIVE_HARVEST_MILESTONE_ID,
  MOCK_NETWORK_GAUGES,
  MOCK_NETWORK_MILESTONES,
  MOCK_NETWORK_STATS,
  type NetworkGauge,
  type NetworkMilestone,
} from "@/lib/data/vital-seed";
import { formatHarvestCurrency } from "@/lib/live/harvest-metrics";

export type NetworkMetricsPanelProps = {
  totalRaised: number;
  goalDollars: number;
  isHarvestLoading: boolean;
  harvestError: string | null;
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatMilestoneValue(milestone: NetworkMilestone): string {
  if (milestone.unit === "usd") {
    return formatCurrency(milestone.current);
  }
  return milestone.current.toLocaleString("en-US");
}

function formatMilestoneTarget(milestone: NetworkMilestone): string {
  if (milestone.unit === "usd") {
    return formatCurrency(milestone.target);
  }
  return milestone.target.toLocaleString("en-US");
}

function GaugeBar({ gauge }: { gauge: NetworkGauge }) {
  const percent = Math.min(100, (gauge.value / gauge.max) * 100);
  const gradient =
    gauge.accent === "blue"
      ? "from-[#1E40AF] to-[#1E40AF]/60"
      : "from-[#B0267A] to-[#B0267A]/60";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-300">
          {gauge.label}
        </p>
        <p className="text-xs font-bold text-white">{gauge.value}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-[#0B090A]">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  );
}

export default function NetworkMetricsPanel({
  totalRaised,
  goalDollars,
  isHarvestLoading,
  harvestError,
}: NetworkMetricsPanelProps) {
  const milestones: NetworkMilestone[] = [
    {
      id: LIVE_HARVEST_MILESTONE_ID,
      label: "Awakening Harvest Goal",
      current: totalRaised,
      target: goalDollars || HARVEST_GOAL_DOLLARS,
      unit: "usd",
    },
    ...MOCK_NETWORK_MILESTONES,
  ];

  return (
    <section className="flex h-full flex-col gap-4 md:gap-6">
      <article className="rounded-2xl border border-[#1E40AF]/30 bg-[#111111]/80 p-4 md:p-6">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#1E40AF]">
          Network Ecosystem
        </p>
        <h2 className="mt-2 text-lg font-bold uppercase tracking-widest text-white">
          Collective Metrics
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            {
              label: "Total Sowed",
              value: isHarvestLoading
                ? "—"
                : formatHarvestCurrency(totalRaised),
            },
            {
              label: "Active Sowers",
              value: MOCK_NETWORK_STATS.activeSowers.toLocaleString("en-US"),
            },
            {
              label: "Sessions / Week",
              value: MOCK_NETWORK_STATS.sessionsThisWeek.toLocaleString("en-US"),
            },
            {
              label: "Avg Gift",
              value: formatCurrency(MOCK_NETWORK_STATS.averageGift),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-[#0B090A]/80 px-3 py-3"
            >
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        {harvestError && (
          <p className="mt-3 text-xs text-amber-400/90">{harvestError}</p>
        )}
      </article>

      <article className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 md:p-6">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Milestone Tracking
        </p>
        <div className="mt-4 space-y-4">
          {milestones.map((milestone) => {
            const percent = Math.min(
              100,
              (milestone.current / milestone.target) * 100,
            );

            return (
              <div key={milestone.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-300">
                    {milestone.label}
                  </p>
                  <p className="text-[0.6rem] text-zinc-500">
                    {formatMilestoneValue(milestone)} / {formatMilestoneTarget(milestone)}
                  </p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-[#0B090A]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A]"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 md:p-6">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Resonance Gauges
        </p>
        <div className="mt-4 space-y-4">
          {MOCK_NETWORK_GAUGES.map((gauge) => (
            <GaugeBar key={gauge.id} gauge={gauge} />
          ))}
        </div>
      </article>

      <a
        href="#sow-seed"
        className="block rounded-2xl border border-[#B0267A]/40 bg-gradient-to-r from-[#1E40AF]/20 to-[#B0267A]/20 px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110"
      >
        Sow a New Vital Seed
      </a>
    </section>
  );
}
