"use client";

import { useState } from "react";
import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { ReadinessCheck } from "@/lib/broadcast/types";

type ReadinessGateProps = {
  score: number;
  checks: ReadinessCheck[];
  canGoLive: boolean;
  isLive: boolean;
  rehearsalMode: boolean;
  criticalCount: number;
  supervisorOverride: boolean;
  supervisorReason: string;
  onSupervisorOverrideChange: (enabled: boolean, reason: string) => void;
  onGoLive: () => void;
  onEndLive: () => void;
};

export default function ReadinessGate({
  score,
  checks,
  canGoLive,
  isLive,
  rehearsalMode,
  criticalCount,
  supervisorOverride,
  supervisorReason,
  onSupervisorOverrideChange,
  onGoLive,
  onEndLive,
}: ReadinessGateProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [reasonDraft, setReasonDraft] = useState(supervisorReason);
  const hardBlockCount = checks.filter((c) => c.hardBlock && !c.passed).length;
  const failingCount = checks.filter((c) => !c.passed).length;

  const scoreTone =
    score >= 85
      ? PARABLE_STATUS.green
      : score >= 65
        ? PARABLE_STATUS.yellow
        : score >= 40
          ? PARABLE_STATUS.orange
          : PARABLE_STATUS.red;

  return (
    <section className="rounded-md border border-white/10 bg-[#111111] p-1.5">
      <p className={`font-ui text-[0.45rem] font-bold uppercase tracking-[0.14em] ${PARABLE_SHELL.muted}`}>
        Readiness Gate
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-[#0B090A] ${scoreTone.border} ${scoreTone.text}`}
        >
          <span className="font-headline text-lg leading-none">{score}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.05em] text-white">
            {criticalCount > 0 || hardBlockCount > 0
              ? `${criticalCount + hardBlockCount} blockers`
              : "Interlock clear"}
          </p>
          <p className={`font-ui text-[0.45rem] ${PARABLE_SHELL.muted}`}>
            {failingCount} open · override ≥8
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-1">
        {!isLive ? (
          <>
            <button
              type="button"
              disabled={!canGoLive}
              onClick={onGoLive}
              className={`touch-target w-full rounded border px-2 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40 ${PARABLE_SHELL.btnPrimary}`}
            >
              {rehearsalMode ? "Simulate Go Live" : "Go Live"}
            </button>
            <button
              type="button"
              onClick={() => setShowOverride((v) => !v)}
              className={`touch-target w-full rounded border border-white/12 px-2 py-1 font-ui text-[0.48rem] font-bold uppercase tracking-[0.06em] ${PARABLE_SHELL.muted}`}
            >
              Supervisor Override
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onEndLive}
            className={`touch-target w-full rounded border px-2 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] ${PARABLE_STATUS.red.border} ${PARABLE_STATUS.red.text}`}
          >
            {rehearsalMode ? "End Rehearsal" : "Stop Live"}
          </button>
        )}
      </div>

      {showOverride && !isLive ? (
        <div className={`mt-1.5 rounded border p-2 ${PARABLE_STATUS.orange.border} ${PARABLE_STATUS.orange.bg}`}>
          <label className="block">
            <span className={`font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] ${PARABLE_STATUS.orange.text}`}>
              Override reason (min 8 chars)
            </span>
            <textarea
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-white/10 bg-[#0B090A] px-2 py-1 font-body text-xs text-white focus:border-[#1E40AF]/50 focus:outline-none"
              placeholder="Document bypass reason…"
            />
          </label>
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              onClick={() => {
                onSupervisorOverrideChange(true, reasonDraft);
                setShowOverride(false);
              }}
              disabled={reasonDraft.trim().length < 8}
              className={`touch-target rounded border px-2 py-1 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] disabled:opacity-50 ${PARABLE_STATUS.orange.border} ${PARABLE_STATUS.orange.text}`}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                onSupervisorOverrideChange(false, "");
                setReasonDraft("");
                setShowOverride(false);
              }}
              className={`touch-target rounded border border-white/10 px-2 py-1 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] ${PARABLE_SHELL.muted}`}
            >
              Clear
            </button>
          </div>
          {supervisorOverride ? (
            <p className={`mt-1 font-ui text-[0.48rem] uppercase tracking-[0.08em] ${PARABLE_STATUS.orange.text}`}>
              Override active
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
