"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Info, Search, ShieldAlert } from "lucide-react";
import type { DateRangePreset, IncidentSeverity } from "@/lib/incidents/types";
import type { UseIncidentLogsReturn } from "@/lib/incidents/useIncidentLogs";
import { cn } from "@/lib/utils";

type IncidentFiltersProps = {
  setup: UseIncidentLogsReturn;
};

const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "24h", label: "Last 24 Hours" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "custom", label: "Custom Range" },
];

function FilterButton({
  label,
  active,
  onClick,
  icon,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  tone?: "critical" | "warning" | "info";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] transition",
        active
          ? "border-brand-purple/40 bg-gradient-to-r from-brand-purple/30 to-brand-blue/20 text-white"
          : "border-slate-800 bg-[#070b14] text-slate-300 hover:border-slate-600",
      )}
    >
      {icon}
      <span
        className={cn(
          !active && tone === "critical" && "text-rose-400",
          !active && tone === "warning" && "text-amber-400",
          !active && tone === "info" && "text-brand-blue",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export default function IncidentFilters({ setup }: IncidentFiltersProps) {
  const {
    severityFilter,
    setSeverityFilter,
    search,
    setSearch,
    datePreset,
    setDatePreset,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
  } = setup;

  return (
    <section
      aria-label="Quick filters"
      className="rounded-xl border border-slate-800 bg-[#0b1220] p-4"
    >
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
        Quick Filters
      </h2>

      <div className="space-y-2">
        <FilterButton label="All" active={severityFilter === "all"} onClick={() => setSeverityFilter("all")} />
        <FilterButton
          label="Critical"
          active={severityFilter === "critical"}
          onClick={() => setSeverityFilter("critical")}
          tone="critical"
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />}
        />
        <FilterButton
          label="Warnings"
          active={severityFilter === "warning"}
          onClick={() => setSeverityFilter("warning")}
          tone="warning"
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />}
        />
        <FilterButton
          label="Info"
          active={severityFilter === "info"}
          onClick={() => setSeverityFilter("info")}
          tone="info"
          icon={<Info className="h-4 w-4 text-brand-blue" aria-hidden="true" />}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Date Range
        </span>
        <select
          value={datePreset}
          onChange={(event) => setDatePreset(event.target.value as DateRangePreset)}
          aria-label="Date range"
          className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2.5 font-body text-sm text-white"
        >
          {DATE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      {datePreset === "custom" ? (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">From</span>
            <input
              type="datetime-local"
              value={customDateFrom}
              onChange={(event) => setCustomDateFrom(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">To</span>
            <input
              type="datetime-local"
              value={customDateTo}
              onChange={(event) => setCustomDateTo(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
      ) : null}

      <label className="relative mt-4 block">
        <span className="mb-1.5 block font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Search
        </span>
        <Search
          className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search incidents..."
          aria-label="Search incidents"
          className="w-full rounded-lg border border-slate-700 bg-[#070b14] py-2.5 pl-9 pr-3 font-body text-sm text-white placeholder:text-slate-500"
        />
      </label>
    </section>
  );
}
