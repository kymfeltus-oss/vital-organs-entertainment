"use client";

import { motion } from "framer-motion";
import {
  formatContributionStatus,
  type ContributionEntry,
} from "@/lib/data/vital-seed";

type ContributionLedgerProps = {
  entries: readonly ContributionEntry[];
  personalTotal: number;
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function ContributionLedger({
  entries,
  personalTotal,
}: ContributionLedgerProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#111111]/80 p-4 md:p-6">
      <header>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#1E40AF]">
          Personal Ledger
        </p>
        <h2 className="mt-2 text-lg font-bold uppercase tracking-widest text-white">
          Your Seed Sowing
        </h2>
        <p className="mt-2 text-2xl font-bold text-[#B0267A]">
          {formatCurrency(personalTotal)}
        </p>
        <p className="text-xs text-zinc-500">Lifetime confirmed contributions</p>
      </header>

      <ul className="mt-6 flex flex-1 flex-col gap-3 overflow-y-auto">
        {entries.map((entry, index) => (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-white/10 bg-[#0B090A]/80 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{entry.label}</p>
                <p className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-zinc-500">
                  {entry.date} · {entry.channel}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-[#1E40AF]">
                  {formatCurrency(entry.amount)}
                </p>
                <p
                  className={`mt-1 text-[0.55rem] font-bold uppercase tracking-[0.12em] ${
                    entry.status === "paid"
                      ? "text-[#1E40AF]"
                      : entry.status === "processing"
                        ? "text-zinc-400"
                        : "text-zinc-500"
                  }`}
                >
                  {formatContributionStatus(entry.status)}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
