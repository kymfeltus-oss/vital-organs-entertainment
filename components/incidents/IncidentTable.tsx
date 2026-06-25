"use client";

import { Filter } from "lucide-react";
import type { Incident, IncidentSeverity } from "@/lib/incidents/types";
import { cn } from "@/lib/utils";

type IncidentTableProps = {
  incidents: Incident[];
  total: number;
  onSelect: (id: string) => void;
  onOpenFilters: () => void;
};

function severityBadgeClass(severity: IncidentSeverity): string {
  switch (severity) {
    case "critical":
      return "border-rose-500/40 bg-rose-500/10 text-rose-400";
    case "warning":
      return "border-amber-500/40 bg-amber-500/10 text-amber-400";
    case "info":
      return "border-brand-blue/40 bg-brand-blue/10 text-brand-blue";
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function IncidentTable({
  incidents,
  total,
  onSelect,
  onOpenFilters,
}: IncidentTableProps) {
  return (
    <section className="flex min-h-[560px] flex-col rounded-xl border border-slate-800 bg-[#0b1220]">
      <div className="border-b border-slate-800 px-4 py-4 md:px-5">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">
          Incident Snapshot Drawer
        </h2>
        <p className="mt-1 font-body text-sm text-brand-blue">
          Access Logs &amp; Incident Snapshots
        </p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-800 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              <th className="px-4 py-3 md:px-5">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Severity</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center font-body text-sm text-slate-400">
                  No incidents match the current filters.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr
                  key={incident.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open incident ${incident.action}`}
                  onClick={() => onSelect(incident.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(incident.id);
                    }
                  }}
                  className="cursor-pointer border-b border-slate-800/70 transition hover:bg-[#070b14]"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 md:px-5">
                    {formatTime(incident.time)}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-white">{incident.user}</td>
                  <td className="px-4 py-3 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-white">
                    {incident.action.replace(/_/g, " ")}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 font-body text-xs text-slate-300">
                    {incident.target}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em]",
                        severityBadgeClass(incident.severity),
                      )}
                    >
                      {incident.severity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 md:px-5">
        <p className="font-body text-xs text-slate-400">Total Incidents: {total}</p>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Open advanced filters"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-slate-300 transition hover:text-white"
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Filter
        </button>
      </div>
    </section>
  );
}
