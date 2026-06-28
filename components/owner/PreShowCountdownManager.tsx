"use client";

import { useEffect, useState } from "react";
import type { OwnerBroadcastSnapshot, PreflightCheck } from "@/lib/owner/contracts";

type PreShowCountdownManagerProps = {
  snapshot: OwnerBroadcastSnapshot;
  pendingTodos: PreflightCheck[];
  onAdjustTimer: (offsetSeconds: number) => void;
  onSavePreShow: (payload: {
    concertTitle: string;
    headlinerName: string;
    gatesLocked: boolean;
    preShowVipOnly: boolean;
  }) => void;
  timerPending?: boolean;
  savePending?: boolean;
};

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-5 text-center">
      <p className="font-headline text-4xl tabular-nums tracking-[0.08em] text-slate-50 sm:text-5xl">
        {padUnit(value)}
      </p>
      <p className="mt-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function SafetyLine({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
      <span
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
          ok ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.7)]" : "bg-red-400"
        }`}
        aria-hidden="true"
      />
      <div>
        <p className="font-body text-sm font-semibold text-slate-100">{label}</p>
        <p className="mt-0.5 font-body text-xs text-slate-500">{detail}</p>
      </div>
    </li>
  );
}

export default function PreShowCountdownManager({
  snapshot,
  pendingTodos,
  onAdjustTimer,
  onSavePreShow,
  timerPending = false,
  savePending = false,
}: PreShowCountdownManagerProps) {
  const { countdown, eventPhase, gate, vmix, feed } = snapshot;
  const hasTarget = Boolean(countdown.targetIso);
  const [concertTitle, setConcertTitle] = useState(gate.concertTitle);
  const [headlinerName, setHeadlinerName] = useState(gate.headlinerName);
  const [accessMode, setAccessMode] = useState<"vip" | "open">(
    gate.gatesLocked || gate.preShowVipOnly ? "vip" : "open",
  );

  useEffect(() => {
    setConcertTitle(gate.concertTitle);
    setHeadlinerName(gate.headlinerName);
    setAccessMode(gate.gatesLocked || gate.preShowVipOnly ? "vip" : "open");
  }, [gate.concertTitle, gate.gatesLocked, gate.headlinerName, gate.preShowVipOnly]);

  const encoderOk = vmix?.connection === "reachable" || snapshot.publish.status === "publishing";
  const mediaSocketOk = feed.primary.manifestReachable || feed.backup.manifestReachable;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="border-b border-slate-800 pb-4">
        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-400">
          Concert Gathering Setup Desk
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-slate-50">
          Hybrid Pre-Show Setup
        </h1>
        <p className="mt-2 font-body text-sm text-slate-400">
          Event phase: <span className="font-semibold text-slate-200">{eventPhase.phase}</span>
          {eventPhase.startTime ? ` · Starts ${eventPhase.startTime}` : ""}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
          <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Pre-show clock
          </h2>

          <div className="mt-5">
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
                  ? "The show window is open or the countdown has ended."
                  : "No active countdown target is set."}
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled={timerPending || !hasTarget}
              onClick={() => onAdjustTimer(300)}
              className="min-h-11 rounded-full border border-sky-500/40 bg-sky-500/10 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sky-200 disabled:opacity-40"
            >
              +5 mins
            </button>
            <button
              type="button"
              disabled={timerPending || !hasTarget}
              onClick={() => onAdjustTimer(-300)}
              className="min-h-11 rounded-full border border-slate-700 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-200 disabled:opacity-40"
            >
              -5 mins
            </button>
            <button
              type="button"
              disabled
              className="min-h-11 rounded-full border border-slate-800 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500 opacity-60"
            >
              Pause clock
            </button>
          </div>

          <div className="mt-7">
            <h3 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
              Pre-flight hardware safety checklist
            </h3>
            <ul className="mt-3 grid gap-2">
              <SafetyLine
                label="Encoder connection"
                ok={encoderOk}
                detail={encoderOk ? "Encoder is reachable or publishing." : "Encoder is not confirmed yet."}
              />
              <SafetyLine
                label="Media socket connection"
                ok={mediaSocketOk}
                detail={mediaSocketOk ? "At least one HLS feed is reachable." : "No HLS feed is reachable yet."}
              />
              <SafetyLine
                label="Setup checklist"
                ok={pendingTodos.length === 0}
                detail={
                  pendingTodos.length === 0
                    ? "No current checklist blockers."
                    : `${pendingTodos.length} setup item needs attention.`
                }
              />
            </ul>
          </div>
        </section>

        <section className="flex rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
          <div className="flex w-full flex-col">
            <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
              Live show settings
            </h2>

            <label className="mt-5 block">
              <span className="font-body text-sm font-semibold text-slate-200">Concert title</span>
              <input
                value={concertTitle}
                onChange={(event) => setConcertTitle(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-body text-sm text-slate-100 outline-none focus:border-sky-400"
              />
            </label>

            <label className="mt-4 block">
              <span className="font-body text-sm font-semibold text-slate-200">Lead pastor name</span>
              <input
                value={headlinerName}
                onChange={(event) => setHeadlinerName(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-body text-sm text-slate-100 outline-none focus:border-sky-400"
              />
            </label>

            <fieldset className="mt-5">
              <legend className="font-body text-sm font-semibold text-slate-200">Door access</legend>
              <div className="mt-2 grid gap-2">
                <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 font-body text-sm text-slate-200">
                  <input
                    type="radio"
                    name="pre-show-access"
                    checked={accessMode === "vip"}
                    onChange={() => setAccessMode("vip")}
                  />
                  Hold public doors and allow VIP early access
                </label>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 font-body text-sm text-slate-200">
                  <input
                    type="radio"
                    name="pre-show-access"
                    checked={accessMode === "open"}
                    onChange={() => setAccessMode("open")}
                  />
                  Open doors to everyone immediately
                </label>
              </div>
            </fieldset>

            <button
              type="button"
              disabled={savePending}
              onClick={() =>
                onSavePreShow({
                  concertTitle,
                  headlinerName,
                  gatesLocked: accessMode === "vip",
                  preShowVipOnly: accessMode === "vip",
                })
              }
              className="mt-auto min-h-14 w-full rounded-xl bg-sky-400 px-4 font-ui text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-950 disabled:opacity-50"
            >
              Save details and start pre-show countdown clock
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
