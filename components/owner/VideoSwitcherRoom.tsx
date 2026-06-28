"use client";

import { useCallback } from "react";

type VideoSwitcherRoomProps = {
  activePreviewInput: number;
  activeProgramInput: number;
  commandPending?: boolean;
  onSendVmixCommand: (command: string, inputId: number) => void;
};

const INPUT_SOURCES = [
  { id: 1, label: "INPUT 1: MAIN CAM" },
  { id: 2, label: "INPUT 2: CHOIR WIDE" },
  { id: 3, label: "INPUT 3: BACKSTAGE CLOSE" },
] as const;

export default function VideoSwitcherRoom({
  activePreviewInput,
  activeProgramInput,
  commandPending = false,
  onSendVmixCommand,
}: VideoSwitcherRoomProps) {
  const handlePreviewInput = useCallback(
    (inputId: number) => {
      onSendVmixCommand("PreviewInput", inputId);
    },
    [onSendVmixCommand],
  );

  const handleCutDirect = useCallback(() => {
    onSendVmixCommand("Cut", 0);
  }, [onSendVmixCommand]);

  const handleAutoFade = useCallback(() => {
    onSendVmixCommand("Fade", 0);
  }, [onSendVmixCommand]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 p-4 md:max-w-5xl sm:p-6">
      <header className="border-b border-slate-800 pb-4">
        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-400">
          Camera Switcher
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-slate-50">
          Preview & Program Routing
        </h1>
        <p className="mt-2 font-body text-sm text-slate-400">
          Remote command console only — no local media capture or video players.
        </p>
      </header>

      <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 lg:hidden">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-slate-500">
          Bus status
        </p>
        <div className="mt-3 flex flex-col gap-2 font-body text-sm text-slate-200">
          <p>
            Preview:{" "}
            <span className="font-semibold text-emerald-300">
              Input #{activePreviewInput || "—"}
            </span>
          </p>
          <p>
            Program:{" "}
            <span className="font-semibold text-red-300">Input #{activeProgramInput || "—"}</span>
          </p>
        </div>
      </section>

      <section className="hidden gap-4 lg:grid lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-emerald-500/60 bg-slate-900/60 p-5 shadow-[0_0_24px_rgba(16,185,129,0.08)]">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-emerald-400">
            vMix PREVIEW BUS
          </p>
          <div className="mt-4 flex aspect-video items-center justify-center rounded-xl border border-emerald-500/30 bg-slate-950/80">
            <p className="font-headline text-lg uppercase tracking-[0.12em] text-emerald-200">
              Input #{activePreviewInput || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-red-500/70 bg-slate-900/60 p-5 shadow-[0_0_28px_rgba(239,68,68,0.12)]">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-red-400">
            vMix PROGRAM LIVE
          </p>
          <div className="mt-4 flex aspect-video animate-pulse items-center justify-center rounded-xl border border-red-500/40 bg-slate-950/80">
            <p className="font-headline text-lg uppercase tracking-[0.12em] text-red-200">
              Input #{activeProgramInput || "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
          Source Select Grid
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INPUT_SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              disabled={commandPending}
              onClick={() => handlePreviewInput(source.id)}
              className="min-h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-200 hover:border-emerald-500/40 hover:text-emerald-200 disabled:opacity-40"
            >
              [{source.label}]
            </button>
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
        <button
          type="button"
          disabled={commandPending}
          onClick={handleCutDirect}
          className="min-h-12 w-full rounded-full border border-red-400/50 bg-red-500/10 px-8 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-red-200 disabled:opacity-40 sm:w-auto"
        >
          [⚡ TAKE CUTDIRECT]
        </button>
        <button
          type="button"
          disabled={commandPending}
          onClick={handleAutoFade}
          className="min-h-12 w-full rounded-full border border-slate-600 bg-slate-800 px-8 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-100 disabled:opacity-40 sm:w-auto"
        >
          [🔄 AUTO FADE MIX]
        </button>
      </section>
    </div>
  );
}
