"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { readinessShortLabel } from "@/lib/production/preshow-setup";
import type { UsePreShowSetupReturn } from "@/hooks/production/usePreShowSetup";
import { cn } from "@/lib/utils";

type PreShowReadinessPanelProps = {
  setup: UsePreShowSetupReturn;
};

function ReadinessGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 72;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * Math.PI;
  const progress = (clamped / 100) * circumference;
  const strokeColor =
    clamped >= 100 ? "#00f2ff" : clamped >= 80 ? "#53fc18" : "#ef4444";

  return (
    <div className="relative mx-auto flex h-[150px] w-[180px] items-end justify-center">
      <svg
        width="180"
        height="110"
        viewBox="0 0 180 110"
        aria-hidden="true"
        className="overflow-visible"
      >
        <path
          d="M 18 100 A 72 72 0 0 1 162 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d="M 18 100 A 72 72 0 0 1 162 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-[stroke-dasharray] duration-500"
          style={{
            filter:
              clamped >= 80
                ? "drop-shadow(0 0 10px rgba(83,252,24,0.45))"
                : "drop-shadow(0 0 10px rgba(239,68,68,0.35))",
          }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <p className="font-headline text-4xl tracking-[0.06em] text-white">{clamped}%</p>
        <p
          className={cn(
            "font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em]",
            clamped >= 100
              ? "text-[#00f2ff]"
              : clamped >= 80
                ? "text-[#53fc18]"
                : "text-red-400",
          )}
        >
          {readinessShortLabel(clamped)}
        </p>
      </div>
    </div>
  );
}

export default function PreShowReadinessPanel({ setup }: PreShowReadinessPanelProps) {
  const {
    readiness,
    preflightRan,
    saveEndpointStatus,
    isSavingSchedule,
    runPreflightCheck,
    saveAllSettings,
    goToDashboard,
    saveMessage,
  } = setup;

  const isSaving = saveEndpointStatus === "saving" || isSavingSchedule;

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-panel/20">
      <div className="border-b border-brand-border px-4 py-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">
          Readiness Score
        </h2>
      </div>

      <div className="flex flex-1 flex-col px-4 py-5">
        <ReadinessGauge score={readiness.score} />

        <ul className="mt-6 space-y-2.5">
          <li className="flex items-center gap-2 font-body text-xs text-brand-muted">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            80%+ Ready for Review
          </li>
          <li className="flex items-center gap-2 font-body text-xs text-brand-muted">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            100% Show Ready
          </li>
          <li className="flex items-center gap-2 font-body text-xs text-brand-muted">
            <Circle className="h-4 w-4 shrink-0 fill-brand-pink text-brand-pink" aria-hidden="true" />
            &lt;80% Not Ready
          </li>
        </ul>

        {preflightRan && saveMessage ? (
          <p className="mt-4 rounded-lg border border-brand-border bg-brand-black/40 px-3 py-2 font-body text-xs text-brand-muted">
            {saveMessage}
          </p>
        ) : null}

        <div className="mt-auto space-y-2.5 pt-6">
          <button
            type="button"
            onClick={runPreflightCheck}
            disabled={isSaving}
            className="touch-target parable-btn-cyan w-full rounded-lg px-4 py-3 font-ui text-[0.58rem] disabled:opacity-40"
          >
            Run Pre-Flight Check
          </button>
          <button
            type="button"
            onClick={() => void saveAllSettings()}
            disabled={isSaving}
            className="touch-target neon-button w-full rounded-lg px-4 py-3 font-ui text-[0.58rem] disabled:opacity-40"
          >
            Save All Settings
          </button>
          <button
            type="button"
            onClick={goToDashboard}
            className="touch-target w-full rounded-lg border border-brand-border bg-brand-black/50 px-4 py-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-brand-muted transition hover:text-white"
          >
            Go To Console
          </button>
        </div>
      </div>
    </section>
  );
}
