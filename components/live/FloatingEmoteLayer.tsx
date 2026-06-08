"use client";

import { motion } from "framer-motion";
import type { FloatingEmote } from "@/lib/useLiveEmoteFanout";

type FloatingEmoteLayerProps = {
  emotes: FloatingEmote[];
  onDismiss: (key: string) => void;
};

export default function FloatingEmoteLayer({
  emotes,
  onDismiss,
}: FloatingEmoteLayerProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {emotes.map((emote) => (
        <motion.div
          key={emote.key}
          initial={{ opacity: 0, y: "80%", scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: "-20%", scale: [0.6, 1.15, 1, 0.9] }}
          transition={{ duration: 2.8, ease: "easeOut" }}
          onAnimationComplete={() => onDismiss(emote.key)}
          className="absolute bottom-[18%] text-4xl drop-shadow-[0_0_18px_rgba(176,38,122,0.65)] md:text-5xl"
          style={{ left: `${emote.originX * 100}%`, transform: "translateX(-50%)" }}
        >
          {emote.emoji}
        </motion.div>
      ))}
    </div>
  );
}
