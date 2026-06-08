"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import type { OpsSnapshot } from "@/lib/ops/types";
import type { RestreamState } from "@/lib/live-hub/restream/types";
import type { VmixState } from "@/lib/live-hub/vmix/types";
import type { ReadinessCheck, SafetyIssue } from "@/lib/live-hub/types";
import type { GoLiveDecision } from "@/lib/live-hub/safety";

type LiveHubGoLiveModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  decision: GoLiveDecision;
  checks: ReadinessCheck[];
  vmix: VmixState | null;
  restream: RestreamState | null;
  snapshot: OpsSnapshot;
  operatorApproved: boolean;
  onOperatorApprovedChange: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function IssueList({ title, issues }: { title: string; issues: SafetyIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0B090A]/80 p-3">
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {issues.map((issue) => (
          <li key={issue.id} className="text-xs text-zinc-300">
            <span className="font-bold text-white">{issue.label}</span>
            <span className="text-zinc-500"> — </span>
            {issue.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LiveHubGoLiveModal({
  isOpen,
  isSubmitting,
  decision,
  checks,
  vmix,
  restream,
  snapshot,
  operatorApproved,
  onOperatorApprovedChange,
  onClose,
  onConfirm,
}: LiveHubGoLiveModalProps) {
  if (!isOpen) return null;

  const failedChecks = checks.filter((check) => check.status === "fail");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B090A]/85 p-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="go-live-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1E40AF]/40 bg-[#111111] shadow-[0_0_48px_rgba(30,64,175,0.2)]"
      >
        <header className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.24em] text-zinc-400">
              Review & Go Live
            </p>
          </div>
          <h2
            id="go-live-modal-title"
            className="mt-2 text-lg font-bold uppercase tracking-widest text-white"
          >
            Final Production Approval
          </h2>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
          <IssueList title="Critical Issues" issues={decision.criticalIssues} />
          <IssueList title="Warnings" issues={decision.warnings} />

          {failedChecks.length > 0 ? (
            <div className="rounded-xl border border-[#B0267A]/40 bg-[#B0267A]/10 p-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#f5c2e0]">
                Failed Readiness Checks
              </p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                {failedChecks.map((check) => (
                  <li key={check.id}>
                    {check.label}: {check.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-[#0B090A]/70 p-3">
              <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-zinc-500">vMix</dt>
              <dd className="mt-1 font-mono text-zinc-200">
                {vmix?.connectionStatus ?? "unknown"} ·{" "}
                {vmix?.isStreaming ? "streaming" : "not streaming"}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B090A]/70 p-3">
              <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-zinc-500">Restream</dt>
              <dd className="mt-1 font-mono text-zinc-200">
                {restream?.connectionStatus ?? "unknown"}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B090A]/70 p-3">
              <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-zinc-500">
                Destination
              </dt>
              <dd className="mt-1 font-mono text-zinc-200">
                {snapshot.stream.primaryConfigured ? "Primary armed" : "Missing"}
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B090A]/70 p-3">
              <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-zinc-500">
                Recording
              </dt>
              <dd className="mt-1 font-mono text-zinc-200">
                {vmix?.isRecording ? "Active" : "Off"}
              </dd>
            </div>
          </dl>

          <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0B090A]/70 p-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={operatorApproved}
              onChange={(event) => onOperatorApprovedChange(event.target.checked)}
              disabled={decision.blocked}
              className="mt-1 h-4 w-4 accent-[#1E40AF]"
            />
            <span>
              I confirm all critical systems are verified and I authorize opening the live
              experience to ticket holders.
            </span>
          </label>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-white/15 px-5 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || decision.blocked || !operatorApproved}
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-[#1E40AF]/70 bg-[#1E40AF]/20 px-5 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#1E40AF]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Going Live...
              </>
            ) : (
              "Confirm Go Live"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
