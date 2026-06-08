"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type NeonWaveformProps = {
  className?: string;
  barCount?: number;
  variant?: "hero" | "strip" | "mini" | "banner" | "line" | "card";
  animate?: boolean;
};

function barHeights(count: number, seed: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.48) * 0.5 + 0.5;
    const jitter = ((index * 13) % 9) / 10;
    return 0.2 + wave * 0.7 + jitter * 0.12;
  });
}

export default function NeonWaveform({
  className = "",
  barCount,
  variant = "strip",
  animate = true,
}: NeonWaveformProps) {
  const count =
    barCount ??
    (variant === "hero"
      ? 64
      : variant === "line"
        ? 80
        : variant === "banner"
          ? 26
          : variant === "card"
            ? 16
            : variant === "mini"
              ? 10
              : 36);

  const heights = useMemo(() => barHeights(count, variant.length), [count, variant]);

  const heightClass =
    variant === "hero"
      ? "h-16"
      : variant === "line"
        ? "h-12"
        : variant === "banner"
          ? "h-9"
          : variant === "card"
            ? "h-2.5"
            : variant === "mini"
              ? "h-5"
              : "h-7";

  const barWidth =
    variant === "line" ? "w-[2px]" : variant === "card" ? "w-[2px]" : "w-[3px]";

  return (
    <div
      className={`flex items-end justify-center gap-[1.5px] ${heightClass} ${className}`}
      aria-hidden="true"
    >
      {heights.map((scale, index) => {
        const t = index / Math.max(count - 1, 1);
        const barColor =
          t < 0.33
            ? "from-[#006CFF] to-[#00B8FF]"
            : t > 0.67
              ? "from-[#FF008C] to-[#FF2BD6]"
              : "from-[#6A00FF] to-[#9D4DFF]";

        const glow =
          t < 0.33
            ? "shadow-[0_0_14px_rgba(0,184,255,1),0_0_24px_rgba(0,184,255,0.5)]"
            : t > 0.67
              ? "shadow-[0_0_14px_rgba(255,0,140,1),0_0_24px_rgba(255,0,140,0.5)]"
              : "shadow-[0_0_14px_rgba(106,0,255,1),0_0_24px_rgba(106,0,255,0.5)]";

        return (
          <motion.span
            key={`${variant}-${index}`}
            className={`${barWidth} rounded-full bg-gradient-to-t ${barColor} ${glow}`}
            style={{ height: `${Math.round(scale * 100)}%`, minHeight: variant === "line" ? 3 : 2 }}
            animate={
              animate
                ? {
                    scaleY: [scale, scale * 1.75, scale * 0.55, scale],
                    opacity: [0.7, 1, 0.8, 0.7],
                  }
                : undefined
            }
            transition={
              animate
                ? {
                    duration: 0.9 + (index % 5) * 0.07,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.015,
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
