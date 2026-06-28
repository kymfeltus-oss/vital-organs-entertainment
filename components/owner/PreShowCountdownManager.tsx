"use client";

import type { OwnerBroadcastSnapshot, PreflightCheck } from "@/lib/owner/contracts";

type PreShowCountdownManagerProps = {
  snapshot: OwnerBroadcastSnapshot;
  pendingTodos: PreflightCheck[];
  onAdjustTimer: (offsetSeconds: number) => void;
  timerPending?: boolean;
};

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-5 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <p className="font-headline text-4xl tabular-nums tracking-[0.08em] text-slate-50 sm:text-5xl">
        {padUnit(value)}
      </p>
      <p className="mt-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function formatBlockerMessage(check: PreflightCheck): string {
  const detail = check.detail?.trim();
  if (detail) {
    return `[⚠️ TO-DO BLOCKER: ${check.label}. ${detail}]`;
  }
  return `[⚠️ TO-DO BLOCKER: ${check.label}]`;
}

export default function PreShowCountdownManager({
  snapshot,
  pendingTodos,
  onAdjustTimer,
  timerPending = false,
}: PreShowCountdownManagerProps) {
  const { countdown, eventPhase } = snapshot;
  const hasTarget = Boolean(countdown.targetIso);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 p-4 md:max-w-4xl sm:p-6">
      <header className="border-b border-slate-800 pb-4">
        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-400">
          Pre-Show Hub
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-slate-50">
          Countdown & Setup Verification
        </h1>
        <p className="mt-2 font-body text-sm text-slate-400">
          Event phase:{" "}
          <span className="font-semibold text-slate-200">{eventPhase.phase.replace(/_/g, " ")}</span>
          {eventPhase.startTime ? ` · Target ${eventPhase.startTime}` : null}
        </p>
      </header>

      <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
          Central Visual Clock
        </h2>

        <div className="mt-6 flex w-full flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full flex-1">
            {hasTarget && !countdown.isComplete ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <CountdownUnit label="Days" value={countdown.days} />
                <CountdownUnit label="Hours" value={countdown.hours} />
                <CountdownUnit label="Minutes" value={countdown.minutes} />
                <CountdownUnit label="Seconds" value={countdown.seconds} />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center font-body text-sm text-slate-400">
                {countdown.isComplete
                  ? "Show window is open or countdown has elapsed."
                  : "No active countdown target configured."}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:shrink-0">
            <button
              type="button"
              disabled={timerPending || !hasTarget}
              onClick={() => onAdjustTimer(-60)}
              className="min-h-11 w-full rounded-full border border-slate-700 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-200 disabled:opacity-40 md:w-auto"
            >
              [-1 Min]
            </button>
            <button
              type="button"
              disabled={timerPending || !hasTarget}
              onClick={() => onAdjustTimer(60)}
              className="min-h-11 w-full rounded-full border border-sky-500/40 bg-sky-500/10 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-sky-200 disabled:opacity-40 md:w-auto"
            >
              [+1 Min]
            </button>
          </div>
        </div>
      </section>

      <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
          Setup Verification To-Do Checklist
        </h2>

        {pendingTodos.length === 0 ? (
          <p className="mt-4 font-body text-sm text-emerald-400">
            All preflight checks clear — no blockers or warnings.
          </p>
        ) : (
          <ul className="mt-4 w-full space-y-3">
            {pendingTodos.map((check) => (
              <li
                key={check.id}
                className={`w-full rounded-lg border px-4 py-3 font-body text-sm ${
                  check.status === "fail"
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                    : "border-amber-300/25 bg-amber-400/5 text-amber-200/90"
                }`}
              >
                {formatBlockerMessage(check)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
