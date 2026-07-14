"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, Lock, Play, RefreshCw } from "lucide-react";
import {
  HISTORIC_VIDEO_SIMULATIONS,
  type HistoricVideoSimulation,
} from "@/lib/enterprise/liv-golf/historic-video-simulations";
import { isShowcaseBetId } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import { triggerDynamicSimulation } from "@/lib/enterprise/liv-golf/trigger-dynamic-simulation";
import type { ProductionSessionRow } from "@/lib/useLiveProductionBroadcast";

export type SimulationDeckPhase = "IDLE" | "LIVE" | "LOCKED" | "RESOLVED";

type StudioSimulationDeckProps = {
  roomId?: string;
  currentSession: ProductionSessionRow | null;
  isDispatching?: boolean;
  onSessionRefresh: () => Promise<void>;
  onLock: () => Promise<boolean>;
  onResolveYes: () => Promise<boolean>;
  onReset: () => Promise<boolean>;
};

function deriveDeckPhase(session: ProductionSessionRow | null): SimulationDeckPhase {
  if (!session?.active_bet_id || !isShowcaseBetId(session.active_bet_id)) {
    return "IDLE";
  }

  if (session.phase === "RESOLVED" || session.resolved_winner) {
    return "RESOLVED";
  }

  if (session.phase === "LOCKED") {
    return "LOCKED";
  }

  return "LIVE";
}

export function StudioSimulationDeck({
  roomId = "liv-golf-tour-main-room",
  currentSession,
  isDispatching = false,
  onSessionRefresh,
  onLock,
  onResolveYes,
  onReset,
}: StudioSimulationDeckProps) {
  const [simError, setSimError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeScenarioId = isShowcaseBetId(currentSession?.active_bet_id)
    ? currentSession?.active_bet_id ?? null
    : null;

  const simPhase = deriveDeckPhase(currentSession);
  const activeSimulation = useMemo(
    () => HISTORIC_VIDEO_SIMULATIONS.find((entry) => entry.id === activeScenarioId) ?? null,
    [activeScenarioId],
  );

  const isBusy = isDispatching || isSimulating;

  const handleLaunch = async (simulation: HistoricVideoSimulation) => {
    setSimError(null);
    setIsSimulating(true);

    try {
      const result = await triggerDynamicSimulation(
        simulation.playerKey,
        simulation.player,
        simulation.lieType,
        simulation.id,
        simulation.scenario.question,
      );

      if (!result.success) {
        setSimError(result.error ?? "Simulation dispatch failed.");
        return;
      }

      await onSessionRefresh();
    } catch (error) {
      setSimError(
        error instanceof Error ? error.message : "Unable to dispatch dynamic simulation.",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLock = async () => {
    await onLock();
  };

  const handleResolve = async () => {
    await onResolveYes();
  };

  const handleReset = async () => {
    setSimError(null);
    await onReset();
  };

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-white shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#CCFF00]">
            Historic Video Simulator
          </h2>
          <p className="text-[11px] text-neutral-400">
            Dynamic odds-feed dispatch — video path injected per clip, no schema changes
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-neutral-600">
            Room: {roomId}
          </p>
        </div>
        {activeScenarioId ? (
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isBusy}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-40"
            aria-label="Reset simulation"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {simError ? (
        <p className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          {simError}
        </p>
      ) : null}

      {activeSimulation ? (
        <div className="mb-4 rounded-xl border border-[#CCFF00]/25 bg-[#CCFF00]/5 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
            Active Run-List
          </p>
          <p className="mt-1 text-xs font-semibold text-white">{activeSimulation.title}</p>
          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-neutral-300">
            <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-1">
              <Clock className="h-3 w-3 text-amber-400" aria-hidden />
              Lock @ {activeSimulation.lockAtSecond}s
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-1">
              <CheckCircle className="h-3 w-3 text-[#CCFF00]" aria-hidden />
              Settle YES @ {activeSimulation.resolveAtSecond}s
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-1 uppercase">
              Phase: {simPhase}
            </span>
          </div>
          {activeSimulation.videoUrl ? (
            <Link
              href={activeSimulation.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[10px] font-bold text-[#CCFF00] hover:underline"
            >
              Open video clip →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {HISTORIC_VIDEO_SIMULATIONS.map((simulation) => {
          const isCurrent = activeScenarioId === simulation.id;

          return (
            <div
              key={simulation.id}
              className={`rounded-xl border p-4 transition-all ${
                isCurrent
                  ? "border-[#CCFF00] bg-black"
                  : "border-neutral-800 bg-neutral-900/60"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-neutral-100">{simulation.title}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase text-neutral-500">
                  {simulation.player}
                </span>
              </div>

              <p className="mb-3 font-mono text-[10px] text-neutral-500">
                Cue: Lock {simulation.lockAtSecond}s · Settle {simulation.resolveAtSecond}s ·{" "}
                {simulation.wageringWindowSeconds}s window · Clip: /videos/{simulation.playerKey}
                .mp4
              </p>

              {!isCurrent ? (
                <button
                  type="button"
                  disabled={activeScenarioId !== null || isBusy}
                  onClick={() => void handleLaunch(simulation)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-800 py-2 text-xs font-bold transition-all hover:bg-[#CCFF00] hover:text-black disabled:opacity-30 disabled:hover:bg-neutral-800 disabled:hover:text-white"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Stage Video &amp; Launch Bet
                </button>
              ) : (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={simPhase !== "LIVE" || isBusy}
                    onClick={() => void handleLock()}
                    className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      simPhase === "LIVE"
                        ? "bg-amber-600 text-white hover:bg-amber-500"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    Lock (at {simulation.lockAtSecond}s)
                  </button>
                  <button
                    type="button"
                    disabled={simPhase !== "LOCKED" || isBusy}
                    onClick={() => void handleResolve()}
                    className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      simPhase === "LOCKED"
                        ? "bg-[#CCFF00] text-black hover:bg-[#b5e000]"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                    Settle YES (at {simulation.resolveAtSecond}s)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-neutral-500">
        Run-list: open{" "}
        <Link href="/enterprise/liv-golf/live" className="text-[#CCFF00] hover:underline">
          Fan Viewer
        </Link>{" "}
        side-by-side, play the clip, then hit Lock and Settle YES at the cue timestamps.
      </p>
    </div>
  );
}
