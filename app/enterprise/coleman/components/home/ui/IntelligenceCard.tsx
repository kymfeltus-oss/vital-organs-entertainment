import type { ReactNode } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

import {
  functionPillFromName,
  liveFallback,
} from "@/app/enterprise/coleman/lib/live-display";
import type { LiveColemanState } from "@/app/enterprise/coleman/lib/types";

type IntelligenceCardProps = {
  currentKey: string | null;
  keyQuality: string | null;
  intelligence: LiveColemanState["intelligence"];
  isLiveEngaged: boolean;
};

function DashboardKnob({
  currentKey,
  keyQuality,
}: {
  currentKey: string | null;
  keyQuality: string | null;
}) {
  return (
    <div className="coleman-dashboard-knob mx-auto">
      <div className="coleman-dashboard-knob__glow" aria-hidden />
      <div className="coleman-dashboard-knob__frame relative">
        <Image
          src="/images/coleman/dashboard-knob.png"
          alt=""
          width={190}
          height={190}
          priority
          className="coleman-dashboard-knob__img object-contain"
          aria-hidden
        />
        <div className="coleman-dashboard-knob__readout pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="coleman-dashboard-knob__readout-bg" aria-hidden />
          <span className="coleman-heading relative z-[1] text-[15px] font-bold leading-none">
            {liveFallback(currentKey)}
          </span>
          <span className="relative z-[1] mt-0.5 text-[7px] font-normal tracking-[0.1em] text-[var(--cp-muted)]">
            {liveFallback(keyQuality)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="coleman-glass-btn inline-block rounded-full px-2 py-0.5 text-[8px] font-normal tracking-wide text-[var(--cp-taupe)] shadow-none">
      {children}
    </span>
  );
}

export default function IntelligenceCard({
  currentKey,
  keyQuality,
  intelligence,
  isLiveEngaged,
}: IntelligenceCardProps) {
  const isOffline = intelligence.status === "OFFLINE";
  const statusLabel = isOffline ? "OFFLINE" : "LIVE";
  const showPulse = isLiveEngaged && !isOffline;
  const functionPill = functionPillFromName(intelligence.functionName);
  const nashvillePill = functionPill;

  return (
    <section className="coleman-intelligence-card coleman-glass-panel-deep relative z-10 rounded-[26px] px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} strokeWidth={1.5} className="text-[var(--cp-espresso)]" />
          <span className="coleman-heading text-[9px] font-semibold tracking-[0.18em]">
            COLEMAN INTELLIGENCE
          </span>
        </div>
        <span className="coleman-glass-btn inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[8px] font-medium tracking-[0.14em] text-[var(--cp-espresso)] shadow-none">
          {showPulse ? (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c45c5c]" />
          ) : null}
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <div className="space-y-3.5">
          <div>
            <p className="coleman-label">FUNCTION</p>
            <p className="coleman-heading mt-1 text-[12px] font-semibold tracking-wide">
              {liveFallback(intelligence.functionName?.split("/")[0]?.trim())}
            </p>
            {functionPill ? (
              <div className="mt-1">
                <Pill>{functionPill}</Pill>
              </div>
            ) : null}
          </div>
          <div>
            <p className="coleman-label">CADENCE POTENTIAL</p>
            <p className="coleman-heading mt-1 text-[12px] font-semibold">
              {liveFallback(intelligence.cadencePotential)}
            </p>
            <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/55">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--cp-champagne)] to-[var(--cp-shadow-medium)] transition-all duration-300"
                style={{ width: `${intelligence.cadenceScore}%` }}
              />
            </div>
          </div>
        </div>

        <DashboardKnob currentKey={currentKey} keyQuality={keyQuality} />

        <div className="space-y-3.5 text-right">
          <div>
            <p className="coleman-label">NASHVILLE NUMBER</p>
            <p className="coleman-heading mt-1 text-[26px] font-bold leading-none">
              {liveFallback(intelligence.nashvilleNumber)}
            </p>
            {nashvillePill ? (
              <div className="mt-1 flex justify-end">
                <Pill>{nashvillePill}</Pill>
              </div>
            ) : null}
          </div>
          <div>
            <p className="coleman-label">SCALE DEGREE</p>
            <p className="coleman-heading mt-1 text-[12px] font-semibold">
              {liveFallback(intelligence.scaleDegree)}
            </p>
          </div>
        </div>
      </div>

      <div className="my-3.5 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <p className="coleman-label mb-2">SUGGESTED VOICINGS</p>
      <div className="flex flex-wrap gap-2">
        {intelligence.suggestedVoicings.length === 0 ? (
          <span className="rounded-xl border border-dashed border-white/70 bg-white/28 px-3 py-1.5 text-[10px] font-normal text-[var(--cp-taupe)]/50">
            +
          </span>
        ) : (
          intelligence.suggestedVoicings.map((voicing) => (
            <span
              key={voicing}
              className="coleman-voicing-pill rounded-xl px-3 py-1.5 text-[10px] font-medium text-[var(--cp-espresso)]"
            >
              {voicing}
            </span>
          ))
        )}
        <span className="coleman-voicing-add" aria-hidden>+</span>
      </div>
    </section>
  );
}
