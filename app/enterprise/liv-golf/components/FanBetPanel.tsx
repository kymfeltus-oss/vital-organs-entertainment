"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import { requestLiveSeedWalletRefresh } from "@/lib/live/seed-wallet-events";
import type { LiveMicroBetPayload } from "@/lib/live/types";

type FanBetPanelProps = {
  activeBet: LiveMicroBetPayload;
  tokenBalance: number;
  isWalletLoading: boolean;
  geoAttestationToken: string | null;
  geoSample: { lat: number; lng: number } | null;
  onBetSuccess: () => Promise<void>;
  compact?: boolean;
};

export default function FanBetPanel({
  activeBet,
  tokenBalance,
  isWalletLoading,
  geoAttestationToken,
  geoSample,
  onBetSuccess,
  compact = false,
}: FanBetPanelProps) {
  const [selectedOption, setSelectedOption] = useState<"Yes" | "No" | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "confirmed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(null);
    setStatus("idle");
    setErrorMessage(null);
  }, [activeBet.bet_id]);

  const handlePlaceWager = async () => {
    if (!selectedOption) return;

    setStatus("submitting");
    setErrorMessage(null);

    if (tokenBalance < activeBet.stake_amount) {
      setErrorMessage("Insufficient fan token balance for this entry.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/place`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betId: activeBet.bet_id,
          selection: selectedOption,
          lat: geoSample?.lat,
          lng: geoSample?.lng,
          capturedAt: new Date().toISOString(),
          geoAttestationToken,
        }),
      });

      if (!response.ok) {
        const errorDetails = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
          code?: string;
        };

        if (response.status === 401) {
          setErrorMessage("session_expired");
        } else if (response.status === 403) {
          const forbidden = errorDetails as { message?: string; code?: string };
          setErrorMessage(forbidden.message ?? "Prop wagering is unavailable in your region.");
        } else {
          setErrorMessage(errorDetails.message ?? errorDetails.error ?? "Wager transmission error occurred.");
        }
        setStatus("error");
        return;
      }

      requestLiveSeedWalletRefresh();
      await onBetSuccess();
      setStatus("confirmed");
    } catch (err) {
      console.error("Ledger write operation failed:", err);
      setErrorMessage("Network loss detected. Connection timed out.");
      setStatus("error");
    }
  };

  return (
    <aside
      className={`flex h-full w-full min-w-0 flex-col justify-between overflow-y-auto bg-[#161616] ${
        compact ? "p-4" : "p-4 sm:p-6"
      }`}
    >
      <div>
        <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
              In-Stream Micro-Bets
            </p>
            <p className="mt-0.5 text-xs liv-text-secondary">LIV Digital Tour Deck</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="block font-mono text-[10px] uppercase liv-text-secondary">
              Tokens Available
            </span>
            <span className="font-mono text-sm font-bold text-white">
              {isWalletLoading ? "---" : tokenBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={compact ? "mt-4" : "mt-8"}>
          <h4
            className={`font-semibold leading-relaxed text-zinc-100 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {activeBet.question}
          </h4>

          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] liv-text-secondary sm:mt-3 sm:gap-3 sm:text-xs">
            <span>Risk: {activeBet.stake_amount} Tokens</span>
            <span>•</span>
            <span className="text-[#CCFF00]">To Win: {activeBet.payout_amount} Tokens</span>
          </div>

          <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${compact ? "mt-4" : "mt-6"}`}>
            {activeBet.options.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={status === "submitting" || status === "confirmed"}
                onClick={() => setSelectedOption(opt)}
                className={`rounded-xl border font-bold uppercase tracking-wider transition-all duration-150 ${
                  compact ? "py-2.5 text-[10px]" : "py-3.5 text-xs"
                } ${
                  selectedOption === opt
                    ? "border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00]"
                    : "border-white/5 bg-white/5 text-zinc-300 hover:border-white/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {status === "confirmed" ? (
          <div className="w-full rounded-xl border border-[#CCFF00]/20 bg-[#CCFF00]/10 p-4 text-center text-xs font-bold uppercase tracking-wider text-[#CCFF00]">
            ✓ Ticket Secured • Transaction Logged
          </div>
        ) : null}

        {status === "error" && errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-normal text-red-400">
            {errorMessage === "session_expired" ? (
              <span>
                Your login has expired.{" "}
                <Link href="/login" className="font-bold text-white underline">
                  Sign in here
                </Link>{" "}
                to re-verify your wallet.
              </span>
            ) : (
              <span>{errorMessage}</span>
            )}
          </div>
        ) : null}

        {status !== "confirmed" ? (
          <button
            type="button"
            disabled={!selectedOption || status === "submitting"}
            onClick={handlePlaceWager}
            className={`w-full rounded-full bg-[#CCFF00] font-extrabold uppercase tracking-[0.2em] text-black shadow-md transition-all hover:bg-[#bce600] disabled:bg-zinc-800 disabled:text-zinc-600 ${
              compact ? "py-3 text-[10px]" : "py-4 text-[11px]"
            }`}
          >
            {status === "submitting" ? "Processing Ledger..." : "Submit Token Ticket"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
