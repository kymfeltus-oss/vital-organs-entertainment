"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";
import { LIV_MODULE_NAV_SAFE } from "@/lib/enterprise/liv-golf/responsive";
import { useLivEnterpriseMetrics } from "@/lib/enterprise/liv-golf/useLivEnterpriseMetrics";
import { useLivStreamStatus } from "@/lib/enterprise/liv-golf/useLivStreamStatus";
import AudienceMap from "../AudienceMap";
import MetricCard from "../MetricCard";
import ModuleNav from "../ModuleNav";
import LivScoreboardCard from "./LivScoreboardCard";

function formatTokenVolume(tokens: number): string {
  return `${tokens.toLocaleString()} Tokens`;
}

export default function LivCommandCenter() {
  const {
    metrics,
    isLoading,
    error,
    liveViewersLabel,
    liveViewersActual,
  } = useLivEnterpriseMetrics();
  const { status: streamStatus } = useLivStreamStatus();

  const eventTitle = streamStatus?.showTitle?.trim() || "LIV Golf Command Center";
  const eventVenue = streamStatus?.eventLocation?.trim();

  const metricCards = [
    {
      label: "Live Viewers",
      value: isLoading ? "..." : liveViewersLabel,
      subtext: metrics?.isLive
        ? `${liveViewersActual.toLocaleString()} concurrent Supabase presence sessions`
        : "Stream in standby",
      accent: "green" as const,
    },
    {
      label: "Digital Revenue",
      value: isLoading ? "..." : (metrics?.harvestRevenue ?? "$0"),
      subtext: "Paid orders · harvest_progress ledger",
      accent: "none" as const,
    },
    {
      label: "Sponsor Placements",
      value: isLoading
        ? "..."
        : `${metrics?.activeSponsorPlacements ?? 0} / ${metrics?.sponsorPresetInventory ?? 0}`,
      subtext: isLoading
        ? "Loading graphics deck..."
        : `${metrics?.sponsorUtilizationPercent ?? 0}% sponsor deck utilization`,
      accent: "none" as const,
    },
    {
      label: "Streaming Health",
      value: metrics?.streamHealth ?? "STANDBY",
      subtext: metrics?.isLive ? "vMix broadcast lane active" : "Global delivery standby",
      accent: metrics?.streamHealth === "EXCELLENT" ? ("green" as const) : ("cyan" as const),
    },
    {
      label: "Micro-Bet Submissions",
      value: isLoading ? "..." : (metrics?.microBetPlacements ?? 0).toLocaleString(),
      subtext: metrics?.activeBetId
        ? `Live pool: ${metrics.activeBetQuestion ?? metrics.activeBetId}`
        : "Awaiting production launch",
      accent: "green" as const,
    },
    {
      label: "Token Engagement",
      value: isLoading ? "..." : formatTokenVolume(metrics?.tokenEngagementVolume ?? 0),
      subtext: "liv_micro_bet seed_transactions ledger volume",
      accent: "none" as const,
    },
  ];

  return (
    <div className={`${DEVICE_FIT_PAGE} bg-[#111111] font-sans text-white antialiased`}>
      <main
        id="main-content"
        className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10 lg:px-12 lg:py-12"
      >
        <header className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/50"
            >
              PARABLE ENTERPRISE
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
            >
              {eventTitle}
            </motion.h1>
            {eventVenue ? (
              <p className="mt-2 text-sm text-white/60">{eventVenue}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link
                href="/enterprise/liv-golf/streaming/setup"
                className="text-[#CCFF00] hover:underline"
              >
                Stream Setup →
              </Link>
              <Link href="/enterprise/liv-golf/studio" className="text-white/50 hover:text-white">
                Production Studio →
              </Link>
              <Link href="/enterprise/liv-golf/live" className="text-white/50 hover:text-white">
                Fan Viewer →
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start gap-3 lg:items-end"
          >
            <p className="text-sm text-white/50">LIV Golf Leadership Telemetry</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white">
                {metrics?.isLive ? "Live Operations" : "Operations Standby"}
              </span>
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-[#141414] px-3 py-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${metrics?.isLive ? "liv-live-dot bg-[#CCFF00]" : "bg-zinc-500"}`}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#CCFF00]">
                  {metrics?.isLive ? "Live" : "Idle"}
                </span>
              </span>
            </div>
          </motion.div>
        </header>

        {error ? (
          <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </p>
        ) : null}

        <section className="py-14 text-center sm:py-16 lg:py-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-[clamp(3rem,18vw,7rem)] font-extralight leading-none tracking-tight text-transparent"
          >
            {isLoading ? "—" : liveViewersLabel}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 text-[11px] font-medium uppercase tracking-[0.26em] text-white/50 sm:text-xs"
          >
            Active Live Viewers
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg"
          >
            Real-time Supabase presence on the broadcast channel ·{" "}
            {isLoading ? "loading retained revenue..." : `${metrics?.retainedRevenue ?? "$0"} D2C harvest`}
          </motion.p>
        </section>

        <section
          aria-label="Key performance metrics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {metricCards.map((metric, index) => (
            <MetricCard key={metric.label} {...metric} index={index} />
          ))}
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <AudienceMap
              liveViewerCount={liveViewersActual}
              isLive={metrics?.isLive ?? false}
              activeSponsorPlacements={metrics?.activeSponsorPlacements ?? 0}
            />
          </div>
          <div className="xl:col-span-4">
            <LivScoreboardCard />
          </div>
        </div>

        <div className={`mt-8 sm:mt-10 ${LIV_MODULE_NAV_SAFE}`}>
          <ModuleNav />
        </div>
      </main>
    </div>
  );
}
