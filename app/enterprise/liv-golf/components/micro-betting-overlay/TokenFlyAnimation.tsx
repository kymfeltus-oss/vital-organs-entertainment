"use client";

import React from "react";
import { motion } from "framer-motion";

export const TokenFlyAnimation = React.memo(() => {
  const coins = Array.from({ length: 12 });

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {coins.map((_, index) => {
        const targetX = (Math.random() - 0.5) * 160;
        const targetY = 180 + Math.random() * 80;

        return (
          <motion.div
            key={index}
            initial={{ x: 180, y: 20, scale: 0.4, opacity: 1 }}
            animate={{
              x: 100 + targetX,
              y: targetY,
              scale: [0.5, 1, 0.2],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: index * 0.04,
            }}
            className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border border-black bg-[#CCFF00] text-[8px] font-black text-black shadow-md"
          >
            $
          </motion.div>
        );
      })}
    </div>
  );
});

TokenFlyAnimation.displayName = "TokenFlyAnimation";
