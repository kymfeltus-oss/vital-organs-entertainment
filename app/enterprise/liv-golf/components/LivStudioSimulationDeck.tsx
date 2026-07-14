"use client";

import { useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";

export type SimulationScenario = {
  id: string;
  label: string;
  playerName: string;
  betId: string;
  lie: string;
  question: string;
  videoPath: string;
};

const DEV_BYPASS_SIGNATURE =
  process.env.NEXT_PUBLIC_LIV_ODDS_WEBHOOK_DEV_TOKEN?.trim() ??
  "4778_liv_golf_test_bypass_token";

/** Locked catalog matrix — 3 active video configurations mapped to production bet IDs. */
export const INGESTION_SCENARIOS: readonly SimulationScenario[] = [
  {
    id: "tiger",
    label: "Tiger Woods - 2005 Masters Chip",
    playerName: "Tiger Woods",
    betId: "tiger-masters-chip",
    lie: "rough",
    question:
      "Will the ball trickling down the slope drop cleanly into the cup for a birdie?",
    videoPath: "/videos/tiger_masters_2005.mp4",
  },
  {
    id: "bryson",
    label: "Bryson DeChambeau - 320yd Tee Drive",
    playerName: "Bryson DeChambeau",
    betId: "bryson-drive",
    lie: "tee",
    question:
      "Will this explosive driving tee-shot exceed 320 yards down the center fairway?",
    videoPath: "/videos/bryson_drive_320.mp4",
  },
  {
    id: "brooks",
    label: "Brooks Koepka - 15ft Birdie Putt",
    playerName: "Brooks Koepka",
    betId: "brooks-putt",
    lie: "green",
    question: "Will he successfully sink this breaking 15-foot putt to score a Birdie?",
    videoPath: "/videos/brooks_putt_birdie.mp4",
  },
] as const;

type LivStudioSimulationDeckProps = {
  onDispatchComplete?: () => void | Promise<void>;
};

/** Tournament live transmission simulator — 3-button odds-feed ingestion switcher. */
export default function LivStudioSimulationDeck({
  onDispatchComplete,
}: LivStudioSimulationDeckProps) {
  const [isDispatching, setIsDispatching] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[System Node]: Simulation engine online. Ready for dispatch.",
  ]);

  const handleTriggerSimulation = async (scenario: SimulationScenario) => {
    setIsDispatching(true);
    setConsoleLogs((prev) => [
      ...prev,
      `[Network Send]: Ingesting ${scenario.playerName} telemetry data packet...`,
    ]);

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/webhooks/odds-feed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Sportradar-Signature": DEV_BYPASS_SIGNATURE,
          },
          body: JSON.stringify({
            event_type: "SHOT_RECORDED",
            room_id: "00000000-0000-0000-0000-000000000000",
            bet_id: scenario.betId,
            question: scenario.question,
            player: { name: scenario.playerName },
            shot_data: {
              lie: scenario.lie,
              video_asset_path: scenario.videoPath,
            },
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
        active_prop?: string;
        auto_launched_bet?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Internal ingestion failure.");
      }

      const activeProp = data.active_prop ?? data.auto_launched_bet ?? scenario.betId;

      setConsoleLogs((prev) => [
        ...prev,
        `[200 OK]: Prop initialized -> ID: ${activeProp}`,
        `[Realtime]: Synchronized WebSocket frame distributed to fan viewers.`,
      ]);

      await onDispatchComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal ingestion failure.";
      setConsoleLogs((prev) => [...prev, `❌ [Error Fault]: ${message}`]);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="mt-0 w-full rounded-2xl border border-white/5 bg-[#161616] p-5 font-sans text-white">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
            Ingest Simulation
          </span>
          <h3 className="mt-0.5 text-sm font-bold tracking-tight text-white">
            TOURNAMENT LIVE TRANSMISSION SIMULATOR
          </h3>
        </div>
        <span className="rounded border border-white/10 bg-zinc-900 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400">
          Active Roster: 3 Nodes
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {INGESTION_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            disabled={isDispatching}
            onClick={() => void handleTriggerSimulation(scenario)}
            className="group rounded-xl border border-white/10 bg-zinc-900 p-3.5 text-left transition-all hover:border-[#CCFF00] disabled:opacity-30 disabled:hover:border-white/10"
          >
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-[#CCFF00]">
              {scenario.lie} position
            </span>
            <span className="mt-1 block text-xs font-bold text-white">{scenario.label}</span>
          </button>
        ))}
      </div>

      <div className="h-28 w-full overflow-y-auto rounded-xl border border-white/5 bg-black p-3 font-mono text-[11px] leading-relaxed text-zinc-400 shadow-inner">
        {consoleLogs.map((log, index) => (
          <div
            key={index}
            className={
              log.startsWith("❌")
                ? "text-red-400"
                : log.includes("200 OK")
                  ? "text-[#CCFF00]"
                  : ""
            }
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
