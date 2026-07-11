"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type TimeSignature = "4/4" | "3/4" | "6/8";

function createAudioContext(): AudioContext {
  const AudioCtx =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : null;
  if (!AudioCtx) {
    throw new Error("Web Audio API is unavailable.");
  }
  return new AudioCtx({ latencyHint: "interactive" });
}

export default function ColemanMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSig, setTimeSig] = useState<TimeSignature>("4/4");
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  const bpmRef = useRef(bpm);
  const timeSigRef = useRef(timeSig);

  useEffect(() => {
    bpmRef.current = bpm;
    timeSigRef.current = timeSig;
  }, [bpm, timeSig]);

  const stopMetronome = () => {
    setIsPlaying(false);
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setCurrentBeat(0);
  };

  useEffect(() => {
    return () => {
      stopMetronome();
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  const startMetronome = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    setIsPlaying(true);
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    beatRef.current = 0;
    setCurrentBeat(0);

    timerIdRef.current = window.setInterval(() => scheduler(), 25);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const scheduler = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) {
      return;
    }

    const lookAhead = 0.1;
    while (nextNoteTimeRef.current < ctx.currentTime + lookAhead) {
      scheduleNote(beatRef.current, nextNoteTimeRef.current);
      advanceNote();
    }
  };

  const advanceNote = () => {
    const secondsPerBeat = 60 / bpmRef.current;
    const currentSig = timeSigRef.current;
    const stepFactor = currentSig === "6/8" ? 0.5 : 1;
    nextNoteTimeRef.current += secondsPerBeat * stepFactor;

    const totalBeats = currentSig === "4/4" ? 4 : currentSig === "3/4" ? 3 : 6;
    beatRef.current = (beatRef.current + 1) % totalBeats;
  };

  const scheduleNote = (beatNumber: number, time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) {
      return;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const currentSig = timeSigRef.current;
    const isDownbeat = beatNumber === 0;
    const isSecondaryAccent = currentSig === "6/8" && beatNumber === 3;

    osc.frequency.setValueAtTime(isDownbeat ? 1000 : isSecondaryAccent ? 800 : 500, time);

    gainNode.gain.setValueAtTime(1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.06);

    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    window.setTimeout(() => {
      setCurrentBeat(beatNumber);
    }, delayMs);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const cleanTaps = tapTimesRef.current.filter((tap) => now - tap < 2000);
    cleanTaps.push(now);
    tapTimesRef.current = cleanTaps;

    if (cleanTaps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < cleanTaps.length; i += 1) {
        intervals.push(cleanTaps[i] - cleanTaps[i - 1]);
      }
      const avgIntervalMs = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgIntervalMs);
      setBpm(Math.max(40, Math.min(220, calculatedBpm)));
    }
  };

  const totalBeatsCount = timeSig === "4/4" ? 4 : timeSig === "3/4" ? 3 : 6;

  return (
    <div className="coleman-tool-card text-center">
      <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
        Metronome Clock
      </h2>

      <div className="mb-8 flex justify-center gap-3">
        {Array.from({ length: totalBeatsCount }).map((_, idx) => (
          <div
            key={idx}
            className={`h-4 w-4 rounded-full transition-all duration-700 ${
              isPlaying && currentBeat === idx
                ? idx === 0
                  ? "scale-125 bg-[var(--coleman-champagne)] shadow-[var(--coleman-glow-gold)]"
                  : "scale-110 bg-[var(--coleman-text-secondary)]"
                : "bg-[var(--coleman-bg-graphite)]"
            }`}
          />
        ))}
      </div>

      <div className="mb-6 text-center">
        <span className="text-6xl font-light tracking-tight text-[var(--coleman-text-primary)]">{bpm}</span>
        <span className="ml-2 text-sm font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">BPM</span>
      </div>

      <input
        type="range"
        min={40}
        max={220}
        value={bpm}
        onChange={(event) => setBpm(Number.parseInt(event.target.value, 10))}
        className="coleman-range mb-6 h-1 w-full cursor-pointer"
        aria-label="Tempo in beats per minute"
      />

      <div className="mb-6 grid grid-cols-3 gap-2">
        {(["4/4", "3/4", "6/8"] as TimeSignature[]).map((sig) => (
          <button
            key={sig}
            type="button"
            onClick={() => setTimeSig(sig)}
            className={`rounded-lg border py-2 text-sm font-medium transition ${
              timeSig === sig
                ? "border-[var(--coleman-champagne)] bg-[rgba(214,179,122,0.12)] text-[var(--coleman-champagne)] shadow-[var(--coleman-glow-gold)]"
                : "border-transparent bg-transparent text-[var(--coleman-text-muted)] hover:bg-[var(--coleman-glass-frost)]"
            }`}
            aria-pressed={timeSig === sig}
          >
            {sig}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={togglePlayback}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--coleman-glass-border)] bg-[var(--coleman-glass-smoky)] py-4 font-medium text-[var(--coleman-text-primary)] shadow-[var(--coleman-shadow-control)] transition hover:border-[var(--coleman-champagne)] active:scale-[0.98]"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? "STOP" : "START"}
        </button>
        <button
          type="button"
          onClick={handleTapTempo}
          className="rounded-xl border border-[var(--coleman-glass-border)] bg-transparent px-6 py-4 font-medium text-[var(--coleman-text-secondary)] transition hover:border-[var(--coleman-champagne)] hover:text-[var(--coleman-champagne)]"
        >
          TAP
        </button>
      </div>
    </div>
  );
}
