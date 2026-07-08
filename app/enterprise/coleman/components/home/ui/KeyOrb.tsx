"use client";

import { useCallback, useState } from "react";

import GlassButton from "@/app/enterprise/coleman/components/home/ui/GlassButton";
import { liveFallback } from "@/app/enterprise/coleman/lib/live-display";
import type { NoteSpelling } from "@/app/enterprise/coleman/lib/live-theory";

type KeyOrbProps = {
  currentKey: string | null;
  keyQuality: string | null;
  keyBadge: string | null;
  isMicActive: boolean;
  noteSpelling: NoteSpelling;
  onSelectSpelling: (spelling: NoteSpelling) => void;
};

function WaveformDots({ active }: { active: boolean }) {
  return (
    <div className="coleman-key-waveform mb-2 flex items-center justify-center gap-[3px]" aria-hidden="true">
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
  noteSpelling,
  onSelectSpelling,
}: KeyOrbProps) {
  const [spellingAnnouncement, setSpellingAnnouncement] = useState("");

  const selectFlat = useCallback(() => {
    onSelectSpelling("flat");
    setSpellingAnnouncement("Flat spellings selected");
  }, [onSelectSpelling]);

  const selectSharp = useCallback(() => {
    onSelectSpelling("sharp");
    setSpellingAnnouncement("Sharp spellings selected");
  }, [onSelectSpelling]);

  return (
    <>
      <h2 id="coleman-key-finder-heading" className="coleman-sr-only">
        Key Finder
      </h2>

      <div
        id="coleman-spelling-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="coleman-sr-only"
      >
        {spellingAnnouncement}
      </div>

      <div className="coleman-key-finder-shell relative z-10 mx-auto flex w-full max-w-[360px] items-center justify-center py-1">
        <GlassButton
          type="button"
          variant="capsule"
          onClick={selectFlat}
          aria-pressed={noteSpelling === "flat"}
          className={`coleman-spelling-toggle absolute left-0 top-1/2 z-20 !h-auto !w-[54px] -translate-y-1/2 flex-col gap-0.5${
            noteSpelling === "flat" ? " is-active" : ""
          }`}
          aria-label="Flat"
        >
          <span className="text-[17px] font-medium leading-none text-[var(--cp-bronze)]" aria-hidden="true">
            ♭
          </span>
          <span className="coleman-label !text-[7px]" aria-hidden="true">
            FLAT
          </span>
        </GlassButton>

        <div className="coleman-key-orb-wrap">
          <div className="coleman-key-orb coleman-key-finder-result">
            <div className="coleman-key-orb__ambient" aria-hidden="true" />
            <div className="coleman-key-orb__ring-outer" aria-hidden="true" />
            <div className="coleman-key-orb__ring-mid" aria-hidden="true" />
            <div className="coleman-key-orb__ring-champagne" aria-hidden="true" />
            <div className="coleman-key-orb__ring-glow-top" aria-hidden="true" />
            <div className="coleman-key-orb__lens">
              <div className="coleman-key-orb__streak" aria-hidden="true" />
              <div className="coleman-key-orb__highlight" aria-hidden="true" />
              <div className="coleman-key-orb__highlight-2" aria-hidden="true" />
              <div className="coleman-key-orb__bevel" aria-hidden="true" />
              <div className="coleman-key-orb__inner-ring" aria-hidden="true" />
              <div className="coleman-key-orb__refraction" aria-hidden="true" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
                <span className="coleman-label !text-[8px] !tracking-[0.26em]">CURRENT KEY</span>
                <WaveformDots active={isMicActive} />
                <span
                  className="coleman-heading coleman-key-letter font-bold leading-[0.92] tracking-tight"
                  style={{ fontSize: "clamp(4.5rem, 22vw, 5.75rem)" }}
                >
                  {liveFallback(currentKey)}
                </span>
                <span className="coleman-key-subline mt-1 text-[10px] font-normal tracking-[0.14em] text-[var(--cp-taupe)]">
                  {liveFallback(keyQuality)}
                </span>
                {keyBadge ? (
                  <span className="coleman-key-badge mt-2 rounded-full px-2.5 py-0.5 text-[8px] font-normal tracking-wide text-[var(--cp-muted)]">
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
          onClick={selectSharp}
          aria-pressed={noteSpelling === "sharp"}
          className={`coleman-spelling-toggle absolute right-0 top-1/2 z-20 !h-auto !w-[54px] -translate-y-1/2 flex-col gap-0.5${
            noteSpelling === "sharp" ? " is-active" : ""
          }`}
          aria-label="Sharp"
        >
          <span className="text-[17px] font-medium leading-none text-[var(--cp-bronze)]" aria-hidden="true">
            #
          </span>
          <span className="coleman-label !text-[7px]" aria-hidden="true">
            SHARP
          </span>
        </GlassButton>
      </div>
    </>
  );
}
