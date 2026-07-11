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
  onBetSuccess: () => Promise<void>;
};

export default function FanBetPanel({
  activeBet,
  tokenBalance,
  isWalletLoading,
  onBetSuccess,
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
        }),
      });

      if (!response.ok) {
        const errorDetails = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };

        if (response.status === 401) {
          setErrorMessage("session_expired");
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
    <aside className="flex h-full w-full flex-col justify-between bg-[#161616] p-6">
      <div>
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
              In-Stream Micro-Bets
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">LIV Digital Tour Deck</p>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[10px] uppercase text-zinc-500">
              Tokens Available
            </span>
            <span className="font-mono text-sm font-bold text-white">
              {isWalletLoading ? "---" : tokenBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-base font-semibold leading-relaxed text-zinc-100">
            {activeBet.question}
          </h4>

          <div className="mt-3 flex gap-3 font-mono text-xs text-zinc-500">
            <span>Risk: {activeBet.stake_amount} Tokens</span>
            <span>•</span>
            <span className="text-[#CCFF00]">To Win: {activeBet.payout_amount} Tokens</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {activeBet.options.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={status === "submitting" || status === "confirmed"}
                onClick={() => setSelectedOption(opt)}
                className={`rounded-xl border py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
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
            className="w-full rounded-full bg-[#CCFF00] py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-black shadow-md transition-all hover:bg-[#bce600] disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {status === "submitting" ? "Processing Ledger..." : "Submit Token Ticket"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
