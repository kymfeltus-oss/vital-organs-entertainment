"use client";

import { motion } from "framer-motion";
import AudienceMap from "./AudienceMap";
import MetricCard from "./MetricCard";
import ModuleNav from "./ModuleNav";

const METRICS = [
  {
    label: "Live Viewers",
    value: "642,811",
    subtext: "+12% today",
    accent: "none" as const,
  },
  {
    label: "Digital Revenue",
    value: "$8.4M",
    subtext: "Current tournament window",
    accent: "none" as const,
  },
  {
    label: "Sponsor ROI",
    value: "96%",
    subtext: "Measured activation efficiency",
    accent: "none" as const,
  },
  {
    label: "Streaming Health",
    value: "EXCELLENT",
    subtext: "Global delivery stable",
    accent: "cyan" as const,
  },
  {
    label: "AI Opportunities",
    value: "127",
    subtext: "Revenue and engagement signals",
    accent: "none" as const,
  },
  {
    label: "Fan Engagement",
    value: "92%",
    subtext: "Audience interaction score",
    accent: "none" as const,
  },
];

export default function ExecutiveCommandCenter() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
    >
      {/* Header */}
      <header className="flex flex-col gap-8 border-b border-[#2A2A2A]/80 pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#A9B1BC]"
          >
            PARABLE ENTERPRISE
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
          >
            Executive Command Center
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-3 lg:items-end"
        >
          <p className="text-sm text-[#A9B1BC]">Prepared for LIV Golf Leadership</p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white">
              Live Operations
            </span>
            <span className="flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-[#111111] px-3 py-1.5">
              <span className="liv-live-dot h-1.5 w-1.5 rounded-full bg-[#CCFF00]" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#CCFF00]">
                Live
              </span>
            </span>
          </div>
        </motion.div>
      </header>

      {/* Hero */}
      <section className="py-14 text-center sm:py-16 lg:py-20">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-[4.5rem] font-extralight leading-none tracking-tight text-transparent sm:text-[5.5rem] lg:text-[7rem]"
        >
          48.2M
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 text-[11px] font-medium uppercase tracking-[0.26em] text-[#A9B1BC] sm:text-xs"
        >
          Active Digital Fans
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-[#A9B1BC] sm:text-lg"
        >
          Unified visibility across streaming, commerce, sponsorship, tournaments, and fan
          engagement.
        </motion.p>
      </section>

      {/* Metrics */}
      <section
        aria-label="Key performance metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {METRICS.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} index={index} />
        ))}
      </section>

      {/* Map */}
      <div className="mt-8">
        <AudienceMap />
      </div>

      {/* Module navigation */}
      <div className="mt-10">
        <ModuleNav />
      </div>
    </main>
  );
}
