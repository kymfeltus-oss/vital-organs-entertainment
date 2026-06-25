"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { IncidentAdvancedFilters, IncidentSeverity, IncidentStatus } from "@/lib/incidents/types";
import { DEFAULT_INCIDENT_FILTERS, INCIDENT_SEVERITIES, INCIDENT_STATUSES } from "@/lib/incidents/types";

type AdvancedIncidentFilterModalProps = {
  open: boolean;
  filters: IncidentAdvancedFilters;
  onApply: (filters: IncidentAdvancedFilters) => void;
  onReset: () => void;
  onClose: () => void;
};

export default function AdvancedIncidentFilterModal({
  open,
  filters,
  onApply,
  onReset,
  onClose,
}: AdvancedIncidentFilterModalProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Advanced incident filters"
        className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0b1220] p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            Advanced Filters
          </h2>
          <button type="button" onClick={onClose} aria-label="Close advanced filters">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Severity</span>
            <select
              value={draft.severity}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  severity: event.target.value as IncidentSeverity | "all",
                }))
              }
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            >
              <option value="all">All</option>
              {INCIDENT_SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Reviewed status</span>
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as IncidentStatus | "all",
                }))
              }
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            >
              <option value="all">All</option>
              {INCIDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">User</span>
            <input
              value={draft.user}
              onChange={(event) => setDraft((current) => ({ ...current, user: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">Action type</span>
            <input
              value={draft.action}
              onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Date from</span>
            <input
              type="datetime-local"
              value={draft.dateFrom}
              onChange={(event) => setDraft((current) => ({ ...current, dateFrom: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Date to</span>
            <input
              type="datetime-local"
              value={draft.dateTo}
              onChange={(event) => setDraft((current) => ({ ...current, dateTo: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Stream ID</span>
            <input
              value={draft.streamId}
              onChange={(event) => setDraft((current) => ({ ...current, streamId: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Worker ID</span>
            <input
              value={draft.workerId}
              onChange={(event) => setDraft((current) => ({ ...current, workerId: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-white"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_INCIDENT_FILTERS);
              onReset();
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-slate-300"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
