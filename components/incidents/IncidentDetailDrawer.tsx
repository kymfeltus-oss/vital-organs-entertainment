"use client";

import { useState } from "react";
import { CheckCircle, Copy, X } from "lucide-react";
import type { Incident } from "@/lib/incidents/types";

type IncidentDetailDrawerProps = {
  incident: Incident | null;
  onClose: () => void;
  onReview: (id: string) => void;
  onEscalate: (id: string) => void;
};

function recommendedAction(incident: Incident): string {
  if (incident.severity === "critical") {
    return "Escalate to production lead, verify ingest and audio paths, and confirm failover is armed.";
  }
  if (incident.severity === "warning") {
    return "Review the affected subsystem and confirm pre-show checklist before attempting go-live again.";
  }
  return "Monitor during countdown and confirm the event remains informational.";
}

export default function IncidentDetailDrawer({
  incident,
  onClose,
  onReview,
  onEscalate,
}: IncidentDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!incident) return null;

  const fields = [
    ["Incident ID", incident.id],
    ["Time", new Date(incident.time).toLocaleString()],
    ["User", incident.user],
    ["Action", incident.action],
    ["Target", incident.target],
    ["Severity", incident.severity],
    ["Status", incident.status],
    ["Stream ID", incident.streamId],
    ["Tenant ID", incident.tenantId],
    ["Worker ID", incident.workerId],
    ["Description", incident.description],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Incident detail drawer"
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-[#0b1220]"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            Incident Detail
          </h2>
          <button type="button" onClick={onClose} aria-label="Close incident detail">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-[#070b14] px-3 py-2">
              <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 break-all font-body text-sm text-white">{value}</p>
            </div>
          ))}

          <div className="rounded-lg border border-slate-800 bg-[#070b14] px-3 py-2">
            <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-slate-400">
              Raw Event Payload
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-brand-blue">
              {JSON.stringify(incident.payload, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#070b14] px-3 py-2">
            <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-slate-400">
              Related Snapshots
            </p>
            {incident.snapshots.length > 0 ? (
              <ul className="mt-2 space-y-1 font-body text-xs text-slate-300">
                {incident.snapshots.map((snapshot) => (
                  <li key={snapshot}>{snapshot}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 font-body text-xs text-slate-500">No snapshots attached.</p>
            )}
          </div>

          <div className="rounded-lg border border-brand-purple/30 bg-brand-purple/10 px-3 py-2">
            <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-brand-purple">
              Recommended Action
            </p>
            <p className="mt-1 font-body text-sm text-slate-300">{recommendedAction(incident)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={() => onReview(incident.id)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-white"
          >
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Mark Reviewed
          </button>
          <button
            type="button"
            onClick={() => onEscalate(incident.id)}
            className="rounded-lg border border-rose-500/40 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-rose-400"
          >
            Escalate
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(JSON.stringify(incident.payload, null, 2));
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-blue/40 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-brand-blue"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            {copied ? "Copied" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-slate-300"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
