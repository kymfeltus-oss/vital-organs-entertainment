"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface QuickStakesPanelProps {
  fixedStake: number;
  payout: number;
  balance: number;
  onSubmit: () => void;
  disabled: boolean;
  isSubmitting: boolean;
}

export const QuickStakesPanel = React.memo(
  ({ fixedStake, payout, balance, onSubmit, disabled, isSubmitting }: QuickStakesPanelProps) => {
    const hasBalance = balance >= fixedStake;
    const isSubmitDisabled = disabled || !hasBalance || isSubmitting;

    return (
      <div className="mt-auto border-t border-neutral-800 pt-4">
        <div className="mb-3 flex items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-3 py-2 font-mono text-[11px]">
          <span className="text-neutral-400">Risk</span>
          <span className="font-bold text-white">{fixedStake.toLocaleString()} Tokens</span>
        </div>
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#CCFF00]/20 bg-[#CCFF00]/5 px-3 py-2 font-mono text-[11px]">
          <span className="text-neutral-400">To Win</span>
          <span className="font-bold text-[#CCFF00]">{payout.toLocaleString()} Tokens</span>
        </div>

        {!hasBalance ? (
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wide text-rose-400">
            Insufficient balance for this entry
          </p>
        ) : null}

        <button
          type="button"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            isSubmitDisabled
              ? "cursor-not-allowed bg-neutral-800 text-neutral-500"
              : "bg-[#CCFF00] font-extrabold text-black shadow-[0_4px_20px_rgba(204,255,0,0.25)] hover:bg-[#b5e000] active:scale-[0.98]"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Processing Ledger...
            </>
          ) : (
            "Submit Wager"
          )}
        </button>
      </div>
    );
  },
);

QuickStakesPanel.displayName = "QuickStakesPanel";
