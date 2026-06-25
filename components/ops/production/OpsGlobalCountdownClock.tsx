"use client";

import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

export default function OpsGlobalCountdownClock() {
  const { config, countdown, showTimer } = useLobbyCountdown();

  if (!showTimer) {
    return (
      <div className="glass-panel rounded-xl border border-brand-border px-4 py-3">
        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Global Countdown
        </p>
        <p className="mt-1 font-headline text-lg uppercase tracking-[0.12em] text-white">Live window</p>
      </div>
    );
  }

  const parts = [
    { label: "Days", value: countdown.days },
    { label: "Hrs", value: countdown.hours },
    { label: "Min", value: countdown.minutes },
    { label: "Sec", value: countdown.seconds },
  ];

  return (
    <div className="glass-panel rounded-xl border border-brand-border px-4 py-3">
      <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        Global Countdown · {config.headline || "300 Awakening"}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {parts.map((part) => (
          <div key={part.label} className="text-center">
            <p className="font-headline text-2xl tabular-nums text-brand-blue">{part.value}</p>
            <p className="font-ui text-[0.42rem] uppercase tracking-[0.12em] text-brand-muted">
              {part.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
