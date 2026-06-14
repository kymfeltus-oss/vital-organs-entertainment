"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { AWAKENING_ASSETS } from "@/components/awakening/constants";

type WaveformGraphicProps = {
  variant?: "pink" | "blue";
  active?: boolean;
  className?: string;
};

export default function WaveformGraphic({
  variant = "pink",
  active = false,
  className = "",
}: WaveformGraphicProps) {
  const reduceMotion = useReducedMotion();
  const src =
    variant === "blue" ? AWAKENING_ASSETS.ui.waveformBlue : AWAKENING_ASSETS.ui.waveformPink;

  return (
    <motion.div
      className={`relative h-3 w-12 shrink-0 ${className}`}
      animate={
        active && !reduceMotion
          ? { opacity: [0.65, 1, 0.75, 1], scaleY: [0.92, 1.06, 0.96, 1] }
          : undefined
      }
      transition={active && !reduceMotion ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      <Image src={src} alt="" width={48} height={12} className="h-full w-full object-contain" />
    </motion.div>
  );
}
