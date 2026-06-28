"use client";

import { useCallback } from "react";
import type { AudioLevelTrack } from "@/lib/owner/audio-contracts";

type AudioMonitoringProps = {
  tracks: AudioLevelTrack[];
  aiGainGuardEnabled: boolean;
  mediaNodeStatus?: "online" | "offline" | "degraded";
  mediaNodeDetail?: string | null;
  configPending?: boolean;
  onToggleAiGainGuard: (enabled: boolean) => void;
};

function dbToMeterPercent(db: number): number {
  const clamped = Math.max(-60, Math.min(0, db));
  return ((clamped + 60) / 60) * 100;
}

function VuMeterTrack({ track }: { track: AudioLevelTrack }) {
  const levelPct = dbToMeterPercent(track.levelDb);
  const peakPct = dbToMeterPercent(track.peakDb);

  return (
    <div className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-2">
      <div className="relative flex h-44 w-full max-w-[3.25rem] flex-col justify-end overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-1 sm:h-52">
        <div
          className="absolute left-1 right-1 border-t border-amber-300/80"
          style={{ bottom: `${peakPct}%` }}
          aria-hidden="true"
        />
        <div
          className="w-full rounded-sm bg-gradient-to-t from-emerald-600 via-lime-400 to-amber-300 transition-[height] duration-300"
          style={{ height: `${levelPct}%` }}
        />
      </div>
      <div className="text-center">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-slate-300">
          {track.label}
        </p>
        <p className="mt-0.5 font-body text-[0.62rem] tabular-nums text-slate-500">
          {track.levelDb.toFixed(1)} dB
        </p>
      </div>
    </div>
  );
}

export default function AudioMonitoring({
  tracks,
  aiGainGuardEnabled,
  mediaNodeStatus = "degraded",
  mediaNodeDetail = null,
  configPending = false,
  onToggleAiGainGuard,
}: AudioMonitoringProps) {
  const handleToggleAiGainGuard = useCallback(() => {
    onToggleAiGainGuard(!aiGainGuardEnabled);
  }, [aiGainGuardEnabled, onToggleAiGainGuard]);

  const statusTone =
    mediaNodeStatus === "online"
      ? "text-emerald-400"
      : mediaNodeStatus === "offline"
        ? "text-red-400"
        : "text-amber-300";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 p-4 md:max-w-5xl sm:p-6">
      <header className="border-b border-slate-800 pb-4">
        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-400">
          Sound Control
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-slate-50">
          Live Level Monitoring
        </h1>
        <p className="mt-2 font-body text-sm text-slate-400">
          VU tracks stream telemetry from the backend media node — no local AudioContext metering.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            Input level tracks
          </h2>
          <p className={`font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] ${statusTone}`}>
            Media node · {mediaNodeStatus}
          </p>
        </div>
        {mediaNodeDetail ? (
          <p className="mt-2 font-body text-xs text-slate-500">{mediaNodeDetail}</p>
        ) : null}

        <div className="mt-6 hidden flex-row flex-wrap justify-center gap-4 sm:gap-6 lg:flex">
          {tracks.length === 0 ? (
            <p className="font-body text-sm text-slate-500">Awaiting telemetry tracks…</p>
          ) : (
            tracks.map((track) => <VuMeterTrack key={track.id} track={track} />)
          )}
        </div>

        <ul className="mt-6 w-full space-y-2 lg:hidden">
          {tracks.length === 0 ? (
            <li className="font-body text-sm text-slate-500">Awaiting telemetry tracks…</li>
          ) : (
            tracks.map((track) => (
              <li
                key={track.id}
                className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2"
              >
                <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-slate-300">
                  {track.label}
                </span>
                <span className="font-body text-xs tabular-nums text-slate-400">
                  {track.levelDb.toFixed(1)} dB · peak {track.peakDb.toFixed(1)} dB
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            role="switch"
            aria-checked={aiGainGuardEnabled}
            disabled={configPending}
            onClick={handleToggleAiGainGuard}
            className={`flex min-h-16 w-full max-w-xl items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors disabled:opacity-50 lg:w-auto ${
              aiGainGuardEnabled
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-slate-700 bg-slate-950/80"
            }`}
          >
            <span className="font-ui text-[0.72rem] font-bold uppercase tracking-[0.1em] text-slate-100">
              🛡️ ACTIVATE AUTOMATED AI GAIN GUARD
            </span>
            <span
              className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors ${
                aiGainGuardEnabled ? "border-emerald-400 bg-emerald-500/30" : "border-slate-600 bg-slate-800"
              }`}
            >
              <span
                className={`absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-transform ${
                  aiGainGuardEnabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          <div
            className={`flex-1 rounded-xl border px-4 py-4 ${
              aiGainGuardEnabled
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-slate-800 bg-slate-950/50"
            }`}
          >
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
              Gain guard status
            </p>
            <p className="mt-2 font-body text-sm text-slate-200">
              {aiGainGuardEnabled
                ? "Active — backend limiter adjusts automatically during massive choir peaks to prevent gospel audio clipping on the live stream."
                : "Standby — manual levels only. Enable gain guard before high-dynamic choir segments."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
