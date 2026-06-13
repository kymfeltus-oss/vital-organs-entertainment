"use client";

import { CHECKLIST_STEPS } from "@/lib/live-hub/console-layout";
import type { ChecklistPhase } from "@/lib/live-hub/types";
import LiveHubGoLiveButton from "@/components/live-hub/LiveHubGoLiveButton";

type LiveHubChecklistHeroProps = {
  phases: ChecklistPhase[];
  onTogglePhase: (phaseId: ChecklistPhase["id"]) => void;
  goLiveBlocked: boolean;
  criticalIssueCount: number;
  onGoLive: () => void;
  isLive?: boolean;
  onStop?: () => void;
  isStopping?: boolean;
};

export default function LiveHubChecklistHero({
  phases,
  onTogglePhase,
  goLiveBlocked,
  criticalIssueCount,
  onGoLive,
  isLive = false,
  onStop,
  isStopping = false,
}: LiveHubChecklistHeroProps) {
  const phaseMap = Object.fromEntries(phases.map((phase) => [phase.id, phase]));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1E40AF]/35 bg-[#111111]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1E40AF]/25 via-[#111111] to-[#B0267A]/20" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center gap-1 opacity-50"
      >
        {Array.from({ length: 48 }).map((_, index) => (
          <span
            key={index}
            className="live-waveform-bar w-1 rounded-full bg-gradient-to-t from-[#1E40AF] to-[#B0267A]"
            style={{ animationDelay: `${index * 0.04}s` }}
          />
        ))}
      </div>

      <div className="relative px-6 py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.32em] text-[#93c5fd]">
              Pre-Live Checklist
            </p>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-white md:text-base">
              Every Detail. Every Moment. Eternally Impactful.
            </p>
          </div>

          <LiveHubGoLiveButton
            blocked={goLiveBlocked}
            criticalIssueCount={criticalIssueCount}
            onClick={onGoLive}
            isLive={isLive}
            onStop={onStop}
            isStopping={isStopping}
            variant="hero"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {CHECKLIST_STEPS.map((step, index) => {
            const phase = phaseMap[step.id];
            const complete = phase?.complete ?? false;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onTogglePhase(step.id)}
                title={step.description}
                className={`relative rounded-xl border px-2 py-3 text-center transition ${
                  complete
                    ? "border-[#1E40AF]/55 bg-[#1E40AF]/15 text-[#93c5fd] shadow-[0_0_16px_rgba(30,64,175,0.2)]"
                    : "border-white/10 bg-[#0B090A]/70 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                <span className="block text-[0.5rem] font-bold uppercase tracking-[0.14em] text-zinc-600">
                  Step {index + 1}
                </span>
                <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.1em]">
                  {step.label}
                </span>
                <span className="sr-only">{step.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
