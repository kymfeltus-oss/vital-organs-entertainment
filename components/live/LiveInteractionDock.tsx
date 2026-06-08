"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  formatSeedBalance,
  FREE_SESSION_EMOTE_TAPS,
  LIVE_EMOTES,
  resolveEmoteSeedCost,
  type LiveEmote,
} from "@/lib/live/emotes";
import { useEmoteBatchAccumulator } from "@/lib/useEmoteBatchAccumulator";

type LiveInteractionDockProps = {
  balance: number;
  usedFreeTaps: number;
  isBalanceLoading: boolean;
  balanceError: string | null;
  onBalanceChange: (balance: number) => void;
  onFreeTapsUsedChange: (count: number) => void;
  onLocalEmote: (emote: LiveEmote, originX: number) => void;
  onUpsellOpen: () => void;
  disabled?: boolean;
};

export default function LiveInteractionDock({
  balance,
  usedFreeTaps,
  isBalanceLoading,
  balanceError,
  onBalanceChange,
  onFreeTapsUsedChange,
  onLocalEmote,
  onUpsellOpen,
  disabled = false,
}: LiveInteractionDockProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  const freeTapsRemaining = Math.max(0, FREE_SESSION_EMOTE_TAPS - usedFreeTaps);

  const handleError = useCallback((message: string) => {
    setActionError(message);
  }, []);

  const { queueEmote } = useEmoteBatchAccumulator({
    freeSessionTapsUsed: usedFreeTaps,
    balance,
    onLocalEmote,
    onBalanceChange,
    onFreeTapsUsedChange,
    onUpsellOpen,
    onError: handleError,
    disabled,
  });

  return (
    <div className="mt-3 shrink-0 rounded-2xl border border-[#1E40AF]/35 bg-[#111111]/90 p-3 shadow-[0_0_24px_rgba(30,64,175,0.15)] backdrop-blur-md md:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_rgba(30,64,175,0.35)]">
            {isBalanceLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : (
              formatSeedBalance(balance)
            )}
          </span>
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-zinc-500">
            {freeTapsRemaining} free taps left
          </span>
        </div>

        <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-zinc-500 md:text-right">
          Tap to broadcast live emotes
        </p>
      </div>

      {(balanceError || actionError) && (
        <p className="mt-2 text-xs text-amber-400/90">{balanceError ?? actionError}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {LIVE_EMOTES.map((emote, index) => {
          const isPremium = emote.tier === "premium";
          const originX = (index + 0.5) / LIVE_EMOTES.length;
          const unitCost = resolveEmoteSeedCost(emote, usedFreeTaps);
          const isAffordable = unitCost === 0 || balance >= unitCost;

          return (
            <motion.button
              key={emote.id}
              type="button"
              aria-label={`Send ${emote.label} emote`}
              whileTap={disabled ? undefined : { scale: 0.92 }}
              onClick={() => queueEmote(emote.id, originX)}
              disabled={disabled || (!isAffordable && unitCost > 0)}
              className={`touch-target relative flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isPremium
                  ? "border-[#B0267A]/50 bg-[#B0267A]/10 shadow-[0_0_14px_rgba(176,38,122,0.35)]"
                  : "border-white/15 bg-[#0B090A] hover:border-[#1E40AF]/50"
              }`}
            >
              {emote.emoji}
              {isPremium && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#B0267A] px-1 text-[0.45rem] font-bold uppercase tracking-wider text-white">
                  Pro
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
