"use client";

import ContributionLedger from "@/components/vital-seed/ContributionLedger";
import NetworkMetricsPanel from "@/components/vital-seed/NetworkMetricsPanel";
import VitalSeedGivingForm from "@/components/vital-seed/VitalSeedGivingForm";
import {
  MOCK_PERSONAL_CONTRIBUTIONS,
  MOCK_NETWORK_STATS,
  sumPersonalContributions,
  VITAL_SEED_PAGE_BACKGROUND,
} from "@/lib/data/vital-seed";
import { formatHarvestCurrency } from "@/lib/live/harvest-metrics";
import { useHarvestMetrics } from "@/lib/useHarvestMetrics";

export default function VitalSeedPage() {
  const personalTotal = sumPersonalContributions(MOCK_PERSONAL_CONTRIBUTIONS);
  const {
    totalRaised,
    goalDollars,
    isLoading: isHarvestLoading,
    error: harvestError,
  } = useHarvestMetrics();

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-brand-black pt-safe pb-safe text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={VITAL_SEED_PAGE_BACKGROUND}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="relative z-10 w-full px-4 py-6 md:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Vital Seed Ecosystem
          </p>
          <h1 className="mt-2 text-xl font-bold uppercase tracking-widest md:text-2xl">
            Giving & Metrics
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Sow a Vital Seed, track your personal ledger, and monitor collective
            network milestones in one unified hub.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-6">
          <VitalSeedGivingForm />

          <article className="rounded-2xl border border-[#1E40AF]/30 bg-[#111111]/80 p-4 md:hidden">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Network Snapshot
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.12em] text-zinc-500">
                  Total Sowed
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {isHarvestLoading ? "—" : formatHarvestCurrency(totalRaised)}
                </p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.12em] text-zinc-500">
                  Active Sowers
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {MOCK_NETWORK_STATS.activeSowers.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          </article>

          <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start">
            <ContributionLedger
              entries={MOCK_PERSONAL_CONTRIBUTIONS}
              personalTotal={personalTotal}
            />
            <NetworkMetricsPanel
              totalRaised={totalRaised}
              goalDollars={goalDollars}
              isHarvestLoading={isHarvestLoading}
              harvestError={harvestError}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
