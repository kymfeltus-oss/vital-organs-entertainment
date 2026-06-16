"use client";

import ContributionLedger from "@/components/vital-seed/ContributionLedger";
import NetworkMetricsPanel from "@/components/vital-seed/NetworkMetricsPanel";
import VitalSeedGivingForm from "@/components/vital-seed/VitalSeedGivingForm";
import {
  MOCK_PERSONAL_CONTRIBUTIONS,
  MOCK_NETWORK_STATS,
  sumPersonalContributions,
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
      <div className="relative z-10 w-full">
        <VitalSeedGivingForm />

        <div className="mx-auto w-full max-w-[1536px] px-4 py-6 md:px-6 lg:px-8">
          <article className="rounded-2xl border border-brand-blue/30 bg-brand-panel/80 p-4 md:hidden">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
              Network Snapshot
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.12em] text-brand-muted">
                  Total Sowed
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {isHarvestLoading ? "—" : formatHarvestCurrency(totalRaised)}
                </p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.12em] text-brand-muted">
                  Active Sowers
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {MOCK_NETWORK_STATS.activeSowers.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          </article>

          <div className="mt-6 flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start">
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
