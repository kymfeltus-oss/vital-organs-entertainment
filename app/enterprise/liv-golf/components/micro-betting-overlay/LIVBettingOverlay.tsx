"use client";

import React from "react";
import { CheckCircle2, Lock, Radio } from "lucide-react";
import { useBettingOverlayState } from "./useBettingOverlayState";
import { TokenBalance } from "./TokenBalance";
import { LatencyBuffer } from "./LatencyBuffer";
import { ActiveMarketCard } from "./ActiveMarketCard";
import { QuickStakesPanel } from "./QuickStakesPanel";
import { TokenFlyAnimation } from "./TokenFlyAnimation";
import { VictoryConfettiCanvas } from "./VictoryConfettiCanvas";
import type { OverlayServerSession } from "./types";
import { useWalletStore } from "@/lib/store/useWalletStore";

export type LIVBettingOverlayProps = {
  roomId: string;
  serverSession: OverlayServerSession | null;
  geoSample: { lat: number; lng: number } | null;
  geoAttestationToken: string | null;
  onWagerSuccess?: () => Promise<void>;
  className?: string;
};

export function LIVBettingOverlay({
  roomId,
  serverSession,
  geoSample,
  geoAttestationToken,
  onWagerSuccess,
  className = "",
}: LIVBettingOverlayProps) {
  const tokenBalance = useWalletStore((state) => state.tokenBalance);
  const {
    currentMarket,
    selectedSelection,
    fixedStake,
    localPhase,
    wagerStatus,
    errorMessage,
    timeLeft,
    windowSeconds,
    showVictory,
    setSelectedSelection,
    placeWager,
  } = useBettingOverlayState({
    roomId,
    serverSession,
    geoSample,
    geoAttestationToken,
    onWagerSuccess,
  });

  const isControlDisabled =
    localPhase === "LOCKED" ||
    localPhase === "RESOLVED" ||
    localPhase === "CONFIRMED" ||
    wagerStatus === "submitting" ||
    wagerStatus === "confirmed";

  const showInteractiveMarket = Boolean(currentMarket) && localPhase !== "RESOLVED";

  return (
    <div
      className={`relative h-full w-full md:w-[340px] ${className}`}
      aria-label="LIV micro-betting overlay"
    >
      <div className="relative flex h-full min-h-0 select-none flex-col overflow-hidden overflow-y-auto rounded-t-3xl border-t border-neutral-800 bg-neutral-900/95 p-4 font-sans text-white shadow-2xl backdrop-blur-md md:min-h-[360px] md:rounded-2xl md:border md:bg-neutral-900/90 md:p-5">
        <VictoryConfettiCanvas isActive={showVictory} />

        <div className="mx-auto mb-3 h-1 w-12 shrink-0 rounded-full bg-neutral-700 md:hidden" aria-hidden />

        {localPhase === "CONFIRMED" ? <TokenFlyAnimation /> : null}

        <TokenBalance />

        <div className="mb-1 mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
          <span>⚡ Live Multipliers</span>
          <span
            className={`font-mono transition-colors ${
              localPhase === "CLOSING_SOON"
                ? "animate-pulse font-black text-amber-500"
                : "text-neutral-400"
            }`}
          >
            {localPhase === "LOCKED"
              ? "LOCKED"
              : localPhase === "RESOLVED"
                ? "RESOLVED"
                : showInteractiveMarket
                  ? `${timeLeft}s`
                  : "STANDBY"}
          </span>
        </div>

        {showInteractiveMarket ? (
          <LatencyBuffer
            timeLeft={timeLeft}
            initialTime={windowSeconds}
            phase={localPhase === "CONFIRMED" ? "OPEN" : localPhase}
          />
        ) : (
          <div className="mb-4 h-1 w-full rounded-full bg-neutral-800" />
        )}

        <div className="relative flex flex-1 flex-col justify-between overflow-y-auto">
          {showInteractiveMarket && currentMarket ? (
            <>
              <ActiveMarketCard
                market={currentMarket}
                selectedId={selectedSelection}
                onSelect={setSelectedSelection}
                disabled={isControlDisabled}
              />

              <QuickStakesPanel
                fixedStake={fixedStake}
                payout={currentMarket.payoutAmount}
                balance={tokenBalance}
                onSubmit={() => void placeWager()}
                disabled={isControlDisabled || !selectedSelection}
                isSubmitting={wagerStatus === "submitting"}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
              <div className="rounded-full border border-neutral-700 bg-black/40 p-3 text-[#CCFF00]">
                <Radio className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-300">
                Awaiting Live Prop
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                Studio dispatch will surface the next in-stream micro-bet here in real time.
              </p>
            </div>
          )}

          {errorMessage ? (
            <p
              className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-[10px] text-rose-300"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {localPhase === "LOCKED" ? (
            <div className="liv-overlay-fade-in absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-xl bg-neutral-900/80 backdrop-blur-md">
              <div className="rounded-full border border-rose-500 bg-rose-600/20 p-2.5 text-rose-500 shadow-lg shadow-rose-950/50">
                <Lock className="h-5 w-5 animate-bounce" aria-hidden />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-500">
                Market Locked
              </span>
              <span className="text-[10px] text-neutral-400">
                Processing real-time shot telemetry...
              </span>
            </div>
          ) : null}

          {localPhase === "RESOLVED" ? (
            <div
              className={`liv-overlay-fade-in absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-xl backdrop-blur-md ${
                showVictory ? "bg-neutral-900/70" : "bg-neutral-900/85"
              }`}
            >
              <div
                className={`rounded-full border p-2.5 shadow-lg ${
                  showVictory
                    ? "border-[#CCFF00] bg-[#CCFF00]/15 text-[#CCFF00]"
                    : "border-neutral-600 bg-neutral-800/80 text-neutral-300"
                }`}
              >
                <CheckCircle2 className={`h-5 w-5 ${showVictory ? "animate-bounce" : ""}`} aria-hidden />
              </div>
              <span
                className={`text-xs font-black uppercase tracking-widest ${
                  showVictory ? "text-[#CCFF00]" : "text-neutral-300"
                }`}
              >
                {showVictory ? "You Won!" : "Market Resolved"}
              </span>
              {serverSession?.resolved_winner ? (
                <span className="font-mono text-[11px] font-bold text-[#CCFF00]">
                  Winner: {serverSession.resolved_winner}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-500">Awaiting next studio launch...</span>
              )}
            </div>
          ) : null}

          {localPhase === "CONFIRMED" ? (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-xl bg-neutral-900/80 backdrop-blur-md">
              <div className="rounded-full border border-[#CCFF00] bg-[#CCFF00]/10 p-2.5 text-[#CCFF00] shadow-lg shadow-black">
                <CheckCircle2 className="h-6 w-6 scale-110" aria-hidden />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">
                Wager Accepted
              </span>
              <span className="font-mono text-[11px] font-bold text-neutral-300">
                {fixedStake.toLocaleString()} Tokens Locked
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
