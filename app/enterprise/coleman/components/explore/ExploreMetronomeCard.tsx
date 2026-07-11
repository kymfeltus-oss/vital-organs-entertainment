"use client";

import { Hand, Minus, Play, Plus, SlidersHorizontal, Square, Timer } from "lucide-react";

import {
  tempoMarking,
  useExploreStudio,
  type ExploreTimeSignature,
} from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";

const SIGS: ExploreTimeSignature[] = ["4/4", "3/4", "6/8"];

function beatCount(sig: ExploreTimeSignature): number {
  if (sig === "3/4") return 3;
  if (sig === "6/8") return 6;
  return 4;
}

export default function ExploreMetronomeCard() {
  const {
    bpm,
    setBpm,
    nudgeBpm,
    timeSignature,
    setTimeSignature,
    isPlaying,
    currentBeat,
    scheduleStatus,
    play,
    stop,
    tapTempo,
  } = useExploreStudio();

  const beats = beatCount(timeSignature);

  return (
    <section id="metronome" className="exo-card exo-metronome-card scroll-mt-2">
      <div className="exo-card-heading">
        <Timer size={25} strokeWidth={1.25} />
        <h2 className="exo-card-title">Metronome</h2>
      </div>

      <div className="exo-metronome-grid">
        <div className="exo-bpm-dial">
          <span className="exo-dial-label">BPM</span>
          <span className="exo-bpm-dial-value">{bpm}</span>
          <span className="exo-bpm-rule" />
          <span className="exo-dial-tempo">{tempoMarking(bpm)}</span>
        </div>

        <div className="exo-metro-controls">
          <p className="exo-control-label">Time Signature</p>
          <div className="exo-segment">
            {SIGS.map((sig) => (
              <button
                key={sig}
                type="button"
                onClick={() => setTimeSignature(sig)}
                className={timeSignature === sig ? "is-active" : ""}
                aria-pressed={timeSignature === sig}
              >
                {sig}
              </button>
            ))}
          </div>

          <div className="exo-bpm-row">
            <span className="exo-control-label">BPM</span>
            <button
              type="button"
              className="exo-mini-button"
              onClick={() => nudgeBpm(-1)}
              aria-label="Decrease BPM"
            >
              <Minus size={12} />
            </button>
            <input
              type="range"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="exo-range flex-1"
              aria-label="BPM slider"
            />
            <button
              type="button"
              className="exo-mini-button"
              onClick={() => nudgeBpm(1)}
              aria-label="Increase BPM"
            >
              <Plus size={12} />
            </button>
            <span className="exo-bpm-readout">{bpm}</span>
          </div>

          <div className="exo-transport-row">
            <button
              type="button"
              className="exo-circle-btn exo-play-btn"
              onClick={play}
              aria-label="Play"
            >
              <Play size={36} fill="currentColor" />
            </button>
            <button
              type="button"
              className="exo-circle-btn exo-stop-btn"
              onClick={stop}
              aria-label="Stop"
            >
              <Square size={20} fill="currentColor" />
            </button>
            <button
              type="button"
              className="exo-circle-btn exo-tap-btn"
              onClick={tapTempo}
              aria-label="Tap tempo"
            >
              <Hand size={26} />
            </button>
            <span className="exo-tap-copy">Tap at least<br />3 times</span>
          </div>
        </div>

        <div className="exo-beat-col">
          <span>Accent</span>
          {Array.from({ length: beats }).map((_, idx) => (
            <span
              key={idx}
              className={`exo-beat-dot${idx === 0 ? " is-accent" : ""}${
                isPlaying && currentBeat === idx ? " is-active" : ""
              }`}
            />
          ))}
          <span>Beat</span>
        </div>
      </div>

      <div className="exo-card-footer">
        <div className="exo-status-copy">
          <span>Schedule Status</span>
          <strong>
            <i className="exo-live-dot" />
            {scheduleStatus}
          </strong>
        </div>
        <button type="button" className="exo-advanced-button">
          Advanced
          <SlidersHorizontal size={16} strokeWidth={1.35} />
        </button>
      </div>
    </section>
  );
}
