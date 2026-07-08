"use client";

import GlassButton from "@/app/enterprise/coleman/components/home/ui/GlassButton";
import { liveFallback } from "@/app/enterprise/coleman/lib/live-display";
import type { NoteSpelling } from "@/app/enterprise/coleman/lib/live-theory";

type KeyOrbProps = {
  currentKey: string | null;
  keyQuality: string | null;
  keyBadge: string | null;
  isMicActive: boolean;
  isStandby?: boolean;
  noteSpelling: NoteSpelling;
  onSelectSpelling: (spelling: NoteSpelling) => void;
};

function WaveformDots({ active }: { active: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-center gap-[3px]" aria-hidden>
      {[3, 5, 7, 5, 3].map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-[var(--cp-muted)]/50 ${active ? "animate-pulse" : ""}`}
          style={{ height: h, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export default function KeyOrb({
  currentKey,
  keyQuality,
  keyBadge,
  isMicActive,
  isStandby = false,
  noteSpelling,
  onSelectSpelling,
}: KeyOrbProps) {
  const listening = isMicActive && !currentKey && !isStandby;
  const spellingActiveClass =
    "ring-1 ring-[var(--cp-champagne)] shadow-[0_0_0_1px_rgba(146,97,52,0.25)]";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[360px] items-center justify-center py-1">
      <GlassButton
        type="button"
        variant="capsule"
        onClick={() => onSelectSpelling("flat")}
        aria-pressed={noteSpelling === "flat"}
        className={`absolute left-0 top-1/2 z-20 !h-auto !w-[54px] -translate-y-1/2 flex-col gap-0.5 ${
          noteSpelling === "flat" ? spellingActiveClass : ""
        }`}
        aria-label="Prefer flat spellings"
      >
        <span className="text-[17px] font-medium leading-none text-[var(--cp-bronze)]">♭</span>
        <span className="coleman-label !text-[7px]">FLAT</span>
      </GlassButton>

      <div className="coleman-key-orb-wrap">
        <div className="coleman-key-orb">
          <div className="coleman-key-orb__ambient" aria-hidden />
          <div className="coleman-key-orb__ring-outer" aria-hidden />
          <div className="coleman-key-orb__ring-mid" aria-hidden />
          <div className="coleman-key-orb__ring-champagne" aria-hidden />
          <div className="coleman-key-orb__ring-glow-top" aria-hidden />
          <div className="coleman-key-orb__lens">
            <div className="coleman-key-orb__streak" aria-hidden />
            <div className="coleman-key-orb__highlight" aria-hidden />
            <div className="coleman-key-orb__highlight-2" aria-hidden />
            <div className="coleman-key-orb__bevel" aria-hidden />
            <div className="coleman-key-orb__inner-ring" aria-hidden />
            <div className="coleman-key-orb__refraction" aria-hidden />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
              <span className="coleman-label !text-[8px] !tracking-[0.26em]">CURRENT KEY</span>
              <WaveformDots active={isMicActive} />
              <span
                className={`coleman-heading font-bold leading-[0.92] tracking-tight ${
                  listening ? "text-[4rem] font-light text-[var(--cp-muted)]/50" : ""
                }`}
                style={{ fontSize: listening ? undefined : "clamp(4.5rem, 22vw, 5.75rem)" }}
              >
                {liveFallback(currentKey)}
              </span>
              <span className="mt-1 text-[10px] font-normal tracking-[0.14em] text-[var(--cp-taupe)]">
                {listening ? "LISTENING" : liveFallback(keyQuality)}
              </span>
              {keyBadge ? (
                <span className="coleman-glass-btn relative mt-2 overflow-hidden rounded-full px-2.5 py-0.5 text-[8px] font-normal tracking-wide text-[var(--cp-muted)] shadow-none">
                  {keyBadge}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <GlassButton
        type="button"
        variant="capsule"
        onClick={() => onSelectSpelling("sharp")}
        aria-pressed={noteSpelling === "sharp"}
        className={`absolute right-0 top-1/2 z-20 !h-auto !w-[54px] -translate-y-1/2 flex-col gap-0.5 ${
          noteSpelling === "sharp" ? spellingActiveClass : ""
        }`}
        aria-label="Prefer sharp spellings"
      >
        <span className="text-[17px] font-medium leading-none text-[var(--cp-bronze)]">#</span>
        <span className="coleman-label !text-[7px]">SHARP</span>
      </GlassButton>
    </div>
  );
}
