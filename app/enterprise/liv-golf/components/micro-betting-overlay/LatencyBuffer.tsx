"use client";

import React from "react";
import type { OverlayPhase } from "./types";

interface LatencyBufferProps {
  timeLeft: number;
  initialTime: number;
  phase: OverlayPhase;
}

export const LatencyBuffer = React.memo(({ timeLeft, initialTime, phase }: LatencyBufferProps) => {
  const percentage = initialTime > 0 ? Math.max(0, (timeLeft / initialTime) * 100) : 0;

  const getBarColor = () => {
    if (phase === "CLOSING_SOON") return "bg-amber-500";
    if (phase === "LOCKED" || phase === "RESOLVED") return "bg-rose-600";
    return "bg-[#CCFF00]";
  };

  return (
    <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
      <div
        className={`h-full transition-all duration-1000 ease-linear ${getBarColor()}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});

LatencyBuffer.displayName = "LatencyBuffer";
