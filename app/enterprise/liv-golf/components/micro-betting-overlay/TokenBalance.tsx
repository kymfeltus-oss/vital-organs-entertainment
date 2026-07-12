"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coins, PlusCircle } from "lucide-react";

interface TokenBalanceProps {
  balance: number;
  isLoading?: boolean;
}

export const TokenBalance = React.memo(({ balance, isLoading = false }: TokenBalanceProps) => {
  return (
    <div className="relative border-b border-neutral-800 pb-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Fan Wallet
        </span>

        <div className="flex items-center gap-2">
          <motion.div
            key={balance}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-black/40 px-3 py-1.5"
          >
            <Coins className="h-4 w-4 text-[#CCFF00]" aria-hidden />
            <span className="font-mono text-sm font-bold tracking-tight text-white">
              {isLoading ? "---" : balance.toLocaleString()}
            </span>
          </motion.div>

          <Link
            href="/buy-seeds?return=%2Fenterprise%2Fliv-golf%2Flive"
            className="flex items-center gap-1 rounded-md bg-[#CCFF00] px-2.5 py-1.5 text-[11px] font-bold text-black transition-colors hover:bg-[#b5e000]"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden />
            Get Tokens
          </Link>
        </div>
      </div>
    </div>
  );
});

TokenBalance.displayName = "TokenBalance";
