"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MODULES = [
  "Tournaments",
  "Players",
  "Streaming",
  "Commerce",
  "Sponsors",
  "Analytics",
  "Settings",
] as const;

export default function ModuleNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Executive module navigation"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7"
    >
      {MODULES.map((label, index) => (
        <button
          key={label}
          type="button"
          className={cn(
            "group relative rounded-full border border-[#2A2A2A] bg-[#111111]/80 px-4 py-3 text-center transition-all duration-300",
            "hover:-translate-y-0.5 hover:border-[#00F2FF]/45 hover:bg-[#141414] hover:shadow-[0_0_20px_rgba(0,242,255,0.07)]",
            index === 0 && "border-[#00F2FF]/25",
          )}
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A9B1BC] transition-colors duration-300 group-hover:text-white">
            {label}
          </span>
        </button>
      ))}
    </motion.nav>
  );
}
