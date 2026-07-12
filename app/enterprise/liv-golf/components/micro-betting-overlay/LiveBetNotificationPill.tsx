"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import type { OverlayServerSession } from "./types";

export type LiveBetNotificationPillProps = {
  serverSession: OverlayServerSession | null;
  isVisible: boolean;
  onActionClick: () => void;
};

export const LiveBetNotificationPill = React.memo(function LiveBetNotificationPill({
  serverSession,
  isVisible,
  onActionClick,
}: LiveBetNotificationPillProps) {
  if (!serverSession?.is_active || serverSession.phase !== "OPEN") return null;

  const question =
    serverSession.activeBet?.question?.trim() || "A new live prop is open for wagering.";

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -30, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="pointer-events-none absolute left-1/2 top-4 z-50 w-[90%] -translate-x-1/2 transform sm:w-[360px]"
        >
          <button
            type="button"
            onClick={onActionClick}
            className="group pointer-events-auto flex w-full items-center justify-between gap-3 rounded-2xl border border-[#CCFF00]/40 bg-neutral-900/90 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-[#CCFF00]"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative rounded-xl border border-[#CCFF00] bg-[#CCFF00]/10 p-1.5 text-[#CCFF00]">
                <Zap className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
              </div>

              <div className="text-left">
                <span className="mb-1 block text-[9px] font-black uppercase leading-none tracking-widest text-[#CCFF00]">
                  New Live Prop Launched
                </span>
                <p className="max-w-[210px] truncate text-xs font-bold leading-tight text-white">
                  {question}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition-colors group-hover:text-[#CCFF00]">
              <span>Bet</span>
              <ChevronRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

LiveBetNotificationPill.displayName = "LiveBetNotificationPill";
