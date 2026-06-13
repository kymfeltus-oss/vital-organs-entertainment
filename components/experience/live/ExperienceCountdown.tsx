"use client";

import Image from "next/image";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";

type ExperienceCountdownProps = {
  countdown: CountdownParts;
  statusLabel?: string;
  isLoading?: boolean;
  showTimer?: boolean;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export default function ExperienceCountdown({
  countdown,
  statusLabel,
  isLoading = false,
  showTimer = true,
}: ExperienceCountdownProps) {
  if (isLoading) {
    return (
      <p className="font-body text-sm text-zinc-400" aria-live="polite">
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

  const segments =
    countdown.days > 0
      ? [
          { value: pad(countdown.days), label: "Days" },
          { value: pad(countdown.hours), label: "Hrs" },
          { value: pad(countdown.minutes), label: "Min" },
          { value: pad(countdown.seconds), label: "Sec" },
        ]
      : [
          { value: pad(countdown.hours), label: "Hrs" },
          { value: pad(countdown.minutes), label: "Min" },
          { value: pad(countdown.seconds), label: "Sec" },
        ];

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,24rem)]">
      <div className="relative aspect-[4.6/1] w-full">
        <Image
          src={EXPERIENCE_BRAND_ASSETS.countdownFrame}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 92vw, 24rem"
          className="object-contain"
        />
        <div
          className="absolute inset-[22%_8%_24%_8%] flex items-center justify-center"
          aria-live="polite"
          aria-label="Event countdown"
        >
          <div
            className={`flex w-full items-center justify-center gap-1 sm:gap-2 ${
              segments.length === 4 ? "px-1" : "px-4"
            }`}
          >
            {segments.map((segment, index) => (
              <span key={segment.label} className="flex items-center gap-1 sm:gap-2">
                <span className="flex flex-col items-center">
                  <span className="font-headline text-[clamp(1rem,4.5vw,1.65rem)] tabular-nums leading-none text-white">
                    {segment.value}
                  </span>
                  <span className="mt-0.5 hidden font-ui text-[0.42rem] font-bold uppercase tracking-[0.14em] text-zinc-400 sm:inline">
                    {segment.label}
                  </span>
                </span>
                {index < segments.length - 1 ? (
                  <span
                    className="font-headline text-[clamp(0.85rem,3.5vw,1.25rem)] tabular-nums text-white/85"
                    aria-hidden="true"
                  >
                    :
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
