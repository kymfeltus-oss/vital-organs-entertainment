"use client";

import { Info } from "lucide-react";
import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";

/** Read-only roadmap note — no automation wired in v1.0. */
export default function AssistedProducerRoadmap() {
  return (
    <section
      className="rounded-md border border-dashed border-white/10 bg-[#0B090A]/60 p-1.5"
      aria-label="PARABLE Assisted Producer Mode roadmap"
    >
      <div className="flex items-start gap-1">
        <Info className="mt-px h-3 w-3 shrink-0 text-[#1E40AF]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-ui text-[0.42rem] font-bold uppercase tracking-[0.1em] text-white/55">
            PARABLE Assisted Producer Mode
          </p>
          <p className="font-ui text-[0.38rem] uppercase tracking-[0.06em] text-white/30">
            Future Roadmap
          </p>
          <ul className={`mt-1 space-y-0.5 font-ui text-[0.38rem] leading-snug ${PARABLE_SHELL.muted}`}>
            <li>· Assisted Recommendations</li>
            <li>· Rule-Based Automation</li>
            <li>· Semi-Autonomous Switching</li>
            <li>· AI Vision / PTZ Integration</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
