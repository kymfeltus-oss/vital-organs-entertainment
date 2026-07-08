"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  formatBarCountLabel,
  liveFallback,
  parseProgressionEntry,
} from "@/app/enterprise/coleman/lib/live-display";

type ChordProgressionProps = {
  chordProgression: string[];
  activeChordIndex: number | null;
  onSelectChord: (index: number) => void;
  isStandby?: boolean;
};

export default function ChordProgression({
  chordProgression,
  activeChordIndex,
  onSelectChord,
  isStandby = false,
}: ChordProgressionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = chordProgression.length === 0;

  const scrollBy = useCallback((direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -140 : 140,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="coleman-progression relative z-10 mb-3.5 rounded-[22px] px-3 py-3.5">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <span className="coleman-label">CHORD PROGRESSION</span>
        <span className="coleman-label !tracking-[0.16em]">
          {formatBarCountLabel(chordProgression.length, isStandby)}
        </span>
      </div>

      <div className="coleman-progression-ribbon flex items-stretch">
        <button
          type="button"
          onClick={() => scrollBy("left")}
          disabled={isEmpty}
          className="flex w-7 shrink-0 items-center justify-center text-[var(--cp-taupe)] disabled:opacity-30"
          aria-label="Previous"
        >
          <ChevronLeft size={15} strokeWidth={1.25} />
        </button>

        <div
          ref={scrollRef}
          className="coleman-chord-scroll flex flex-1 items-stretch gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isEmpty ? (
            <div className="flex flex-1 items-center justify-center py-2">
              <span className="text-xl font-light text-[var(--cp-muted)]/50">—</span>
            </div>
          ) : (
            chordProgression.map((entry, index) => {
              const { chord, roman } = parseProgressionEntry(entry);
              const isActive = activeChordIndex === index;
              return (
                <div key={`${entry}-${index}`} className="flex items-stretch">
                  {index > 0 ? <div className="coleman-chord-sep" aria-hidden /> : null}
                  <button
                    type="button"
                    onClick={() => onSelectChord(index)}
                    className={`coleman-chord-cell text-center ${
                      isActive ? "coleman-chord-active" : ""
                    }`}
                  >
                    <span className="coleman-heading block text-[14px] font-semibold leading-tight">
                      {chord}
                    </span>
                    <span className="mt-0.5 block text-[9px] font-normal tracking-wide text-[var(--cp-taupe)]">
                      {liveFallback(roman)}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => scrollBy("right")}
          disabled={isEmpty}
          className="flex w-7 shrink-0 items-center justify-center text-[var(--cp-taupe)] disabled:opacity-30"
          aria-label="Next"
        >
          <ChevronRight size={15} strokeWidth={1.25} />
        </button>
      </div>

      {!isEmpty ? (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
          {chordProgression.map((_, index) => (
            <span
              key={`dot-${index}`}
              className={`h-1 rounded-full transition-all ${
                index === activeChordIndex
                  ? "w-3.5 bg-[var(--cp-muted)]/55"
                  : "w-1 bg-[var(--cp-divider)]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
