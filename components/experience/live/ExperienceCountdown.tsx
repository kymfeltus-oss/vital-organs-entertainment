"use client";

import type { CountdownParts } from "@/lib/live/event-lobby";

type ExperienceCountdownProps = {
  countdown: CountdownParts;
  statusLabel?: string;
  isLoading?: boolean;
  showTimer?: boolean;
};

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl border border-brand-border bg-brand-panel/80 px-2 py-3 sm:px-3 sm:py-4">
      <span className="font-headline text-[clamp(1.35rem,5vw,2.25rem)] tabular-nums leading-none text-white">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-2 font-ui text-[0.5rem] font-bold uppercase tracking-[0.18em] text-brand-muted sm:text-[0.55rem]">
        {label}
      </span>
    </div>
  );
}

export default function ExperienceCountdown({
  countdown,
  statusLabel,
  isLoading = false,
  showTimer = true,
}: ExperienceCountdownProps) {
  if (isLoading) {
    return (
      <p className="font-body text-sm text-brand-muted" aria-live="polite">
        Loading event schedule…
      </p>
    );
  }

  if (!showTimer) {
    return null;
  }

  if (countdown.isComplete) {
    return (
      <p className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-blue">
        {statusLabel || "Event starts soon"}
      </p>
    );
  }

  return (
    <div className="grid w-full grid-cols-4 gap-2 sm:gap-3">
      <Unit value={countdown.days} label="Days" />
      <Unit value={countdown.hours} label="Hours" />
      <Unit value={countdown.minutes} label="Min" />
      <Unit value={countdown.seconds} label="Sec" />
    </div>
  );
}
