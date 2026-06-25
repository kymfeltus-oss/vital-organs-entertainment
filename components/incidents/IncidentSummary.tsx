"use client";

import { Download } from "lucide-react";
import type { IncidentSummaryCounts } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

type IncidentSummaryProps = {
  summary: IncidentSummaryCounts;
  onExport: () => void;
  exporting?: boolean;
};

const SUMMARY_ITEMS = [
  {
    key: "total" as const,
    label: "Total Incidents",
    hint: "Today",
    border: "border-slate-700",
    valueClass: "text-white",
  },
  {
    key: "critical" as const,
    label: "Critical",
    hint: "Needs Attention",
    border: "border-rose-500/50",
    valueClass: "text-rose-400",
  },
  {
    key: "warning" as const,
    label: "Warnings",
    hint: "Investigate",
    border: "border-amber-500/50",
    valueClass: "text-amber-400",
  },
  {
    key: "info" as const,
    label: "Info",
    hint: "Informational",
    border: "border-brand-blue/50",
    valueClass: "text-brand-blue",
  },
];

export default function IncidentSummary({
  summary,
  onExport,
  exporting = false,
}: IncidentSummaryProps) {
  return (
    <section
      aria-label="Incident summary"
      className="rounded-xl border border-slate-800 bg-[#0b1220] p-4"
    >
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
        Incident Summary
      </h2>

      <div className="space-y-3">
        {SUMMARY_ITEMS.map((item) => (
          <article
            key={item.key}
            className={cn(
              "rounded-xl border bg-[#070b14] px-4 py-3",
              item.border,
            )}
          >
            <p className={cn("font-headline text-3xl tracking-[0.04em]", item.valueClass)}>
              {summary[item.key]}
            </p>
            <p className="mt-1 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white">
              {item.label}
            </p>
            <p className="font-body text-xs text-slate-400">{item.hint}</p>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={exporting}
        aria-label="Export logs to CSV"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#070b14] px-4 py-3 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white transition hover:border-slate-500 disabled:opacity-50"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export Logs
      </button>
    </section>
  );
}
