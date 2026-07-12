"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coins, PlusCircle } from "lucide-react";
import { useWalletStore } from "@/lib/store/useWalletStore";

export const TokenBalance = React.memo(function TokenBalance() {
  const { tokenBalance, isWalletGlowing, glowType, isWalletLoading, creditTokens } = useWalletStore();

  const getGlowStyles = () => {
    if (!isWalletGlowing) return "border-neutral-800 bg-black/40 text-white";
    return glowType === "WIN"
      ? "border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.4)]"
      : "border-rose-500 bg-rose-500/10 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
  };

  return (
    <div className="flex w-full shrink-0 items-center justify-between border-b border-neutral-800 pb-3">
      <div className="flex items-center gap-2">
        <span className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-neutral-400">
          Demo Wallet
        </span>
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          animate={isWalletGlowing ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${getGlowStyles()}`}
        >
          <Coins className="h-3.5 w-3.5 text-[#CCFF00]" aria-hidden />
          <span className="font-mono font-black tracking-tight">
            {isWalletLoading ? "---" : tokenBalance.toLocaleString()}
          </span>
        </motion.div>

        <button
          type="button"
          onClick={() => creditTokens(1000)}
          className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-[10px] font-black uppercase text-neutral-400 transition-all hover:border-[#CCFF00] hover:bg-[#CCFF00] hover:text-black"
        >
          <PlusCircle className="h-3.5 w-3.5" aria-hidden />
          <span>+1K</span>
        </button>

        <Link
          href="/buy-seeds?return=%2Fenterprise%2Fliv-golf%2Flive"
          className="hidden items-center gap-1 rounded-md bg-[#CCFF00] px-2.5 py-1.5 text-[11px] font-bold text-black transition-colors hover:bg-[#b5e000] sm:flex"
        >
          <PlusCircle className="h-3.5 w-3.5" aria-hidden />
          Get Tokens
        </Link>
      </div>
    </div>
  );
});

TokenBalance.displayName = "TokenBalance";
