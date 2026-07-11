"use client";

import { useExploreStudio } from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";
import { noteWithOctave } from "@/app/enterprise/coleman/components/explore/explore-voicings";

export default function ExploreTunerCard() {
  const { tunerNote, tunerHz, tunerCents, tunerLive } = useExploreStudio();

  const inTune = Math.abs(tunerCents) <= 2 && tunerNote !== "—";
  const needleAngle = Math.max(-50, Math.min(50, tunerCents)) * 1.35;
  const displayNote = noteWithOctave(tunerNote, tunerHz);

  return (
    <section id="tuner" className="exo-card exo-outset scroll-mt-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="exo-card-title mb-0">Tuner</h2>
        <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--exo-green)]">
          <span className="exo-live-dot" />
          LIVE
        </div>
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="exo-tuner-gauge">
            <svg viewBox="0 0 200 110" className="w-full">
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(123,118,111,0.35)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="14"
              />
              {[-50, -25, 0, 25, 50].map((tick) => {
                const angle = ((tick + 50) / 100) * 180 - 180;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + Math.cos(rad) * 62;
                const y1 = 100 + Math.sin(rad) * 62;
                const x2 = 100 + Math.cos(rad) * 72;
                const y2 = 100 + Math.sin(rad) * 72;
                return (
                  <g key={tick}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--exo-muted)" strokeWidth="1" opacity="0.5" />
                    <text
                      x={100 + Math.cos(rad) * 52}
                      y={100 + Math.sin(rad) * 52}
                      textAnchor="middle"
                      fontSize="8"
                      fill="var(--exo-muted)"
                    >
                      {tick === 0 ? "0" : tick}
                    </text>
                  </g>
                );
              })}
              <g transform={`rotate(${needleAngle} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="34"
                  stroke={inTune ? "var(--exo-green)" : "var(--exo-text)"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="5" fill={inTune ? "var(--exo-green)" : "var(--exo-accent)"} />
              </g>
            </svg>
          </div>

          <div className="text-center">
            <p className="text-3xl font-semibold leading-none tracking-tight">
              {displayNote.replace(/(\d+)/, (_, o) => "")}
              <sub className="text-lg">{displayNote.match(/\d+/)?.[0] ?? "2"}</sub>
            </p>
            <p className="mt-1 text-[11px] text-[var(--exo-muted)]">{tunerHz.toFixed(2)} Hz</p>
          </div>
        </div>

        <div className="flex w-[72px] flex-col gap-3 pt-2">
          <div>
            <p
              className={`text-2xl font-semibold tabular-nums ${
                inTune ? "text-[var(--exo-green)]" : "text-[var(--exo-text)]"
              }`}
            >
              {tunerCents > 0 ? "+" : ""}
              {tunerCents.toFixed(1)}
            </p>
            <p className="text-[8px] uppercase tracking-wider text-[var(--exo-green)]">in tune</p>
          </div>

          <div className="exo-inset rounded-lg px-2 py-2 text-center">
            <p className="text-[7px] uppercase tracking-wider text-[var(--exo-muted)]">Target</p>
            <p className="text-[10px] font-medium">±2 cents</p>
            <div className="mx-auto mt-1 h-0.5 w-8 rounded-full bg-[var(--exo-green)]" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[8px] text-[var(--exo-muted)]">
        <span>REFERENCE: 440 Hz</span>
        <span className="flex items-center gap-2">
          INPUT: {tunerLive ? "Microphone" : "Simulated"}
          <span className="flex h-3 items-end gap-0.5" aria-hidden>
            {[3, 5, 4, 6, 3].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-[var(--exo-accent)] opacity-70"
                style={{ height: h, animation: tunerLive ? `pulse 0.${8 + i}s ease-in-out infinite` : undefined }}
              />
            ))}
          </span>
        </span>
      </div>
    </section>
  );
}
