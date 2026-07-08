"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";

export default function ColemanMetronome() {
  const [bpm, setBpm] = useState(72);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      void contextRef.current?.close();
    };
  }, []);

  const click = () => {
    try {
      if (!contextRef.current) {
        contextRef.current = new AudioContext();
      }

      const context = contextRef.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.04);
    } catch {
      setError("Unable to start metronome audio engine.");
    }
  };

  const stop = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  const start = () => {
    setError(null);
    stop();
    click();
    const intervalMs = Math.round(60000 / bpm);
    intervalRef.current = window.setInterval(click, intervalMs);
    setRunning(true);
  };

  return (
    <section className="coleman-glass-panel coleman-tool-panel">
      <h1 className="coleman-tool-title">METRONOME</h1>
      <p className="coleman-tool-sub">Stage tempo guide</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <div className="coleman-metronome-bpm">{bpm}</div>
      <p className="coleman-tool-sub mb-4">BPM</p>

      <input
        type="range"
        min={40}
        max={240}
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
        className="coleman-range"
      />

      <button
        type="button"
        className={`coleman-primary-btn coleman-icon-stroke${running ? " is-active" : ""}`}
        onClick={() => (running ? stop() : start())}
      >
        {running ? <Pause size={18} strokeWidth={1.25} /> : <Play size={18} strokeWidth={1.25} />}
        {running ? "STOP METRONOME" : "START METRONOME"}
      </button>
    </section>
  );
}
