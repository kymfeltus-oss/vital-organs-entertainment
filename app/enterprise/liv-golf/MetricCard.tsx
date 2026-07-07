"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  subtext: string;
  index?: number;
  accent?: "cyan" | "green" | "none";
};

export default function MetricCard({
  label,
  value,
  subtext,
  index = 0,
  accent = "none",
}: MetricCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-[#2A2A2A] bg-[#111111] p-6 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[#00F2FF]/40 hover:shadow-[0_0_24px_rgba(0,242,255,0.08)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-[#00F2FF]/[0.04] to-transparent" />
      </div>

      <p className="relative text-[10px] font-medium uppercase tracking-[0.22em] text-[#A9B1BC]">
        {label}
      </p>

      <p
        className={cn(
          "relative mt-4 text-3xl font-light tracking-tight text-white sm:text-[2rem]",
          accent === "cyan" && "text-[#00F2FF]",
          accent === "green" && "text-[#CCFF00]",
        )}
      >
        {value}
      </p>

      <p className="relative mt-2 text-sm leading-relaxed text-[#A9B1BC]">{subtext}</p>
    </motion.article>
  );
}
