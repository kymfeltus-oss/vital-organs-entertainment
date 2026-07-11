"use client";

import { Radio } from "lucide-react";

import { useExploreStudio } from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";
import { noteWithOctave } from "@/app/enterprise/coleman/components/explore/explore-voicings";

const TUNER_MAJOR_TICKS = [-50, -25, 0, 25, 50];
const TUNER_MINOR_TICKS = Array.from({ length: 41 }, (_, idx) => -50 + idx * 2.5).filter(
  (tick) => !TUNER_MAJOR_TICKS.includes(tick),
);

function tickPoint(tick: number, radius: number) {
  const angle = ((tick + 50) / 100) * 180 - 180;
  const rad = (angle * Math.PI) / 180;
  const coord = (value: number) => Number(value.toFixed(3));
  return {
    x: coord(210 + Math.cos(rad) * radius),
    y: coord(218 + Math.sin(rad) * radius),
  };
}

export default function ExploreDarkTunerCard() {
  const { tunerNote, tunerHz, tunerCents } = useExploreStudio();

  const inTune = Math.abs(tunerCents) <= 2 && tunerNote !== "-";
  const needleAngle = Math.max(-50, Math.min(50, tunerCents)) * 1.35;
  const displayNote = noteWithOctave(tunerNote, tunerHz);
  const noteName = displayNote.replace(/(\d+)/, () => "");
  const octave = displayNote.match(/\d+/)?.[0] ?? "2";

  return (
    <section id="tuner" className="exo-card exo-tuner-card scroll-mt-2">
      <div className="exo-card-heading exo-card-heading-split">
        <div>
          <Radio size={25} strokeWidth={1.25} />
          <h2 className="exo-card-title">Tuner</h2>
        </div>
        <div className="exo-live-pill">
          <span className="exo-live-dot" />
          LIVE
        </div>
      </div>

      <div className="exo-tuner-grid">
        <div className="exo-tuner-left">
          <div className="exo-tuner-gauge">
            <svg viewBox="0 0 420 250" className="w-full" aria-hidden>
              <path
                d="M 42 218 A 168 168 0 0 1 378 218"
                fill="none"
                stroke="rgba(244, 222, 190, 0.12)"
                strokeWidth="22"
              />
              <path
                d="M 54 218 A 156 156 0 0 1 366 218"
                fill="none"
                stroke="rgba(218, 194, 158, 0.48)"
                strokeWidth="5"
              />
              <path
                d="M 158 62 A 156 156 0 0 1 262 62"
                fill="none"
                stroke="var(--exo-green)"
                strokeWidth="10"
                strokeLinecap="round"
                className="exo-tune-arc"
              />

              {TUNER_MINOR_TICKS.map((tick) => {
                const inner = tickPoint(tick, 138);
                const outer = tickPoint(tick, tick % 5 === 0 ? 153 : 148);
                return (
                  <line
                    key={tick}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="rgba(244, 222, 190, 0.45)"
                    strokeWidth={tick % 5 === 0 ? 1.2 : 0.7}
                  />
                );
              })}

              {TUNER_MAJOR_TICKS.map((tick) => {
                const inner = tickPoint(tick, 132);
                const outer = tickPoint(tick, 164);
                const label = tickPoint(tick, 188);
                return (
                  <g key={tick}>
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="rgba(247, 232, 210, 0.86)"
                      strokeWidth="2"
                    />
                    <text
                      x={label.x}
                      y={label.y + (tick === 0 ? -4 : 6)}
                      textAnchor="middle"
                      fontSize="19"
                      fill="var(--exo-cream)"
                    >
                      {tick > 0 ? `+${tick}` : tick}
                    </text>
                  </g>
                );
              })}

              <g transform={`rotate(${needleAngle} 210 218)`}>
                <line
                  x1="210"
                  y1="218"
                  x2="210"
                  y2="68"
                  stroke="var(--exo-cream)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="exo-needle"
                />
                <circle
                  cx="210"
                  cy="218"
                  r="8"
                  fill="var(--exo-panel)"
                  stroke="var(--exo-cream)"
                  strokeWidth="1.4"
                />
              </g>

              <text x="210" y="34" textAnchor="middle" fontSize="21" fill="var(--exo-cream)">
                0
              </text>
            </svg>
            <div className="exo-tuner-note-readout">
              <p>
                {noteName}
                <sub>{octave}</sub>
              </p>
              <span>{tunerHz.toFixed(2)} Hz</span>
            </div>
          </div>
        </div>

        <div className="exo-tuner-right">
          <div className="exo-cents-readout">
            <span>Cents</span>
            <strong className={inTune ? "is-tuned" : ""}>
              {tunerCents > 0 ? "+" : ""}
              {tunerCents.toFixed(1)}
            </strong>
            <em>in tune</em>
            <i />
          </div>

          <div className="exo-target-box">
            <span>Target</span>
            <strong>{"\u00b12"}</strong>
            <em>cents</em>
            <i />
          </div>
        </div>
      </div>

      <div className="exo-tuner-footer">
        <div>
          <span>Reference</span>
          <strong>440 Hz</strong>
        </div>
        <div>
          <span>Input</span>
          <strong>Microphone</strong>
        </div>
        <div className="exo-meter-bars" aria-hidden>
          {[
            16, 24, 18, 29, 20, 34, 16, 26, 20, 31, 19, 25, 35, 45, 30, 54, 62, 48,
            38, 43, 32, 39, 46, 58, 54, 43, 34, 42, 48, 38, 46, 52, 34, 28, 40, 32,
          ].map((height, index) => (
            <span
              key={index}
              className={index > 23 ? "is-green" : index > 13 ? "is-gold" : ""}
              style={{ height }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
