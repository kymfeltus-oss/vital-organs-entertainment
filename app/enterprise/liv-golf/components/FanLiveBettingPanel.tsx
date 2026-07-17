"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import { requestLiveSeedWalletRefresh } from "@/lib/live/seed-wallet-events";
import type { LiveMicroBetPayload } from "@/lib/live/types";
import { useWalletStore } from "@/lib/store/useWalletStore";

export type FanLiveBettingPanelProps = {
  activeBet: LiveMicroBetPayload | null;
  geoAttestationToken?: string | null;
  geoSample?: { lat: number; lng: number } | null;
  onBetSuccess?: () => Promise<void>;
  className?: string;
};

export default function FanLiveBettingPanel({
  activeBet,
  geoAttestationToken = null,
  geoSample = null,
  onBetSuccess,
  className = "",
}: FanLiveBettingPanelProps) {
  const { tokenBalance, isWalletLoading, initializeBalance, triggerGlow } = useWalletStore();
  const [selectedOption, setSelectedOption] = useState<"Yes" | "No" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  const activeBetId = activeBet?.bet_id ?? null;
  const questionText = activeBet?.question ?? null;
  const stakeAmount = activeBet?.stake_amount ?? 50;
  const payoutAmount = activeBet?.payout_amount ?? stakeAmount * 2;
  const multiplier =
    stakeAmount > 0 ? (payoutAmount / stakeAmount).toFixed(1) : "2.0";

  useEffect(() => {
    setSelectedOption(null);
    setTxMessage(null);
  }, [activeBetId]);

  const handlePlaceWager = async () => {
    if (!activeBetId || !selectedOption) return;

    if (tokenBalance < stakeAmount) {
      setTxMessage("Insufficient fan token balance for this entry.");
      return;
    }

    setIsSubmitting(true);
    setTxMessage("Encrypting ledger ticket...");

    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/place`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betId: activeBetId,
          selection: selectedOption,
          lat: geoSample?.lat,
          lng: geoSample?.lng,
          capturedAt: new Date().toISOString(),
          geoAttestationToken,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        balance?: number;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setTxMessage("Sign in to place a wager.");
        } else {
          setTxMessage(data.message ?? data.error ?? "Transaction failed.");
        }
        return;
      }

      if (typeof data.balance === "number") {
        initializeBalance(data.balance);
        triggerGlow("DEDUCT");
      }

      requestLiveSeedWalletRefresh();
      if (onBetSuccess) {
        await onBetSuccess();
      }

      setTxMessage(`Bet placed — ${stakeAmount.toLocaleString()} tokens staked.`);
    } catch (error) {
      setTxMessage(error instanceof Error ? error.message : "Network loss detected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex h-full w-full flex-col justify-between rounded-2xl border border-white/5 bg-[#111111] p-5 font-sans text-white shadow-2xl ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            Account Status
          </span>
          <h4 className="mt-0.5 text-xs font-bold uppercase text-white">Fan Wallet Drawer</h4>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 font-mono text-xs">
          <span className="text-[#CCFF00]" aria-hidden>
            🪙
          </span>
          <span className="font-bold text-white">
            {isWalletLoading ? "---" : tokenBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {!activeBetId ? (
        <div className="my-auto flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full border border-white/10 bg-zinc-900 font-mono text-xs text-zinc-500">
            ✓
          </div>
          <h4 className="mt-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
            Market Resolved
          </h4>
          <p className="mt-1 max-w-[180px] font-mono text-[11px] text-zinc-600">
            Awaiting next live transmission launch from studio cockpit...
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between pt-4">
          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#CCFF00]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#CCFF00]">
                Live Multiplier ({multiplier}x)
              </span>
            </div>
            <p className="mt-2 text-xs font-bold leading-relaxed text-white">
              {questionText ?? "Will the athlete secure the play?"}
            </p>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              Stake {stakeAmount.toLocaleString()} · To win {payoutAmount.toLocaleString()}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["Yes", "No"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedOption(option)}
                disabled={isSubmitting}
                className={`rounded-xl border py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedOption === option
                    ? option === "Yes"
                      ? "border-[#CCFF00] bg-[#CCFF00] text-black shadow-lg shadow-[#CCFF00]/10"
                      : "border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/10"
                    : "border-white/5 bg-zinc-900 text-white hover:border-white/20"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {txMessage ? (
            <div className="mt-3 rounded-xl border border-white/5 bg-zinc-950 p-2.5 text-center font-mono text-[10px] text-zinc-400">
              {txMessage}
            </div>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting || !selectedOption}
            onClick={() => void handlePlaceWager()}
            className="mt-4 w-full rounded-xl bg-[#CCFF00] py-4 font-mono text-[10px] font-black uppercase tracking-widest text-black shadow-md transition-all hover:bg-[#bce600] disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {isSubmitting ? "Processing Ticket..." : "Submit Token Ticket"}
          </button>

          <p className="mt-2 text-center text-[10px] text-zinc-600">
            Need tokens?{" "}
            <Link href="/buy-seeds?return=%2Fenterprise%2Fliv-golf%2Flive" className="text-[#CCFF00] hover:underline">
              Get Tokens
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
