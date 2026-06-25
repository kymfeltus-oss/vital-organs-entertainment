"use client";

import { useState } from "react";
import { X } from "lucide-react";

type IncidentSettingsModalProps = {
  open: boolean;
  showResolved: boolean;
  onShowResolvedChange: (value: boolean) => void;
  onClose: () => void;
};

export default function IncidentSettingsModal({
  open,
  showResolved,
  onShowResolvedChange,
  onClose,
}: IncidentSettingsModalProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Incident settings"
        className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0b1220] p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            Incident Settings
          </h2>
          <button type="button" onClick={onClose} aria-label="Close settings">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#070b14] px-3 py-2">
            <span className="font-body text-sm text-slate-300">Auto refresh table</span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
              className="h-4 w-4 accent-brand-purple"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#070b14] px-3 py-2">
            <span className="font-body text-sm text-slate-300">Show resolved incidents</span>
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(event) => onShowResolvedChange(event.target.checked)}
              className="h-4 w-4 accent-brand-purple"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-white"
          >
            Settings Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-slate-300"
          >
            Settings Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
