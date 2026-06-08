"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useHarvestProgress } from "@/lib/hooks/useHarvestProgress";
import type { AcknowledgmentItem } from "@/lib/live/harvest-tiers";

const GOAL_CENTS = 3_000_000;

function formatAcknowledgmentAmount(amountCents: number): string {
  return (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function acknowledgmentLabel(item: AcknowledgmentItem): string {
  const amount = formatAcknowledgmentAmount(item.amount_cents);

  if (item.tier === "Kingdom Pillar") {
    return `🔥 PILLAR: ${item.display_name} sowed ${amount}!`;
  }

  return `${item.display_name} sowed ${amount}`;
}

function tierChipClassName(tier: AcknowledgmentItem["tier"]): string {
  switch (tier) {
    case "Kingdom Pillar":
      return "border-amber-400/60 bg-amber-950/20 text-amber-100 shadow-[0_0_10px_rgba(234,179,8,0.15)]";
    case "Harvest Partner":
      return "border-[#1E40AF]/60 bg-[#1E40AF]/15 text-[#93c5fd]";
    default:
      return "border-zinc-600/70 bg-zinc-900/70 text-emerald-300";
  }
}

function AcknowledgmentChip({ item }: { item: AcknowledgmentItem }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${tierChipClassName(item.tier)}`}
    >
      {acknowledgmentLabel(item)}
    </motion.span>
  );
}

export default function AwakeningHarvestTracker() {
  const {
    percentage,
    totalFormatted,
    goalFormatted,
    acknowledgments,
    isLoading,
    error,
  } = useHarvestProgress(GOAL_CENTS);

  return (
    <section className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-[#111111]/80 p-4 md:min-h-[480px]">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-zinc-300">
        Awakening Harvest
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-lg font-bold text-white">
          {isLoading ? "—" : totalFormatted}
        </p>
        <p className="text-xs text-zinc-500">Goal {goalFormatted}</p>
      </div>

      {error && <p className="mt-2 text-xs text-amber-400/90">{error}</p>}

      <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/10 bg-[#0B090A]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A] shadow-[0_0_16px_rgba(176,38,122,0.55)] transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        {isLoading
          ? "Syncing harvest ledger..."
          : `${percentage.toFixed(1)}% of harvest goal reached`}
      </p>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Live Donor Acknowledgments
        </p>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#1E40AF]" />
            <span className="text-xs">Connecting acknowledgment stream...</span>
          </div>
        ) : acknowledgments.length === 0 ? (
          <p className="mt-4 text-xs text-zinc-500">
            Waiting for the next harvest contribution...
          </p>
        ) : (
          <div className="mt-3 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <AnimatePresence initial={false} mode="popLayout">
                {acknowledgments.map((item) => (
                  <AcknowledgmentChip key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
