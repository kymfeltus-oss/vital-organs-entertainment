"use client";

import { motion, useReducedMotion } from "framer-motion";

type AudioWaveformProps = {
  active?: boolean;
  color?: string;
  className?: string;
};

const BAR_SCALES = [0.35, 0.85, 0.55, 1, 0.45];

export default function AudioWaveform({
  active = false,
  color = "#FF007F",
  className = "",
}: AudioWaveformProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`flex h-3.5 items-end gap-[2px] ${className}`} aria-hidden="true">
      {BAR_SCALES.map((scale, index) => (
        <motion.span
          key={index}
          className="w-[3px] rounded-full"
          style={{ height: `${scale * 100}%`, backgroundColor: color }}
          animate={
            active && !reduceMotion
              ? { scaleY: [1, 1.5, 0.7, 1.25, 0.95], opacity: [0.65, 1, 0.75, 1, 0.7] }
              : { scaleY: 1, opacity: 0.55 }
          }
          transition={
            active && !reduceMotion
              ? { duration: 0.85, repeat: Infinity, delay: index * 0.08, ease: "easeInOut" }
              : undefined
          }
        />
      ))}
    </div>
  );
}
