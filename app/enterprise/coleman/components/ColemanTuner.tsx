"use client";

import { Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import {
  detectPitch,
  frequencyToNote,
} from "@/app/enterprise/coleman/lib/audio/pitch";

export default function ColemanTuner() {
  const [active, setActive] = useState(false);
  const [note, setNote] = useState("—");
  const [cents, setCents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close();
    };
  }, []);

  const stopListening = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void contextRef.current?.close();
    streamRef.current = null;
    contextRef.current = null;
    setActive(false);
    setNote("—");
    setCents(0);
  };

  const startListening = async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      streamRef.current = stream;
      contextRef.current = context;
      setActive(true);

      const buffer = new Float32Array(analyser.fftSize);

      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        const frequency = detectPitch(buffer, context.sampleRate);
        const reading = frequencyToNote(frequency);
        setNote(reading.note);
        setCents(reading.cents);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setError("Microphone access is required for live tuning.");
    }
  };

  const meterPosition = `${Math.min(Math.max(50 + cents / 2, 8), 92)}%`;

  return (
    <section className="coleman-glass-panel coleman-tool-panel">
      <h1 className="coleman-tool-title">TUNER</h1>
      <p className="coleman-tool-sub">Live pitch lock from microphone input</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <div className="coleman-tuner-display">{note}</div>
      <div className="coleman-tuner-meter">
        <div className="coleman-tuner-center" />
        <div className="coleman-tuner-marker" style={{ left: meterPosition }} />
      </div>
      <p className="coleman-tuner-scale">FLAT &nbsp;&nbsp;|&nbsp;&nbsp; SHARP</p>
      <p className="coleman-tuner-cents">{cents} cents</p>

      <button
        type="button"
        className={`coleman-primary-btn coleman-icon-stroke${active ? " is-active" : ""}`}
        onClick={() => (active ? stopListening() : void startListening())}
      >
        {active ? <MicOff size={18} strokeWidth={1.25} /> : <Mic size={18} strokeWidth={1.25} />}
        {active ? "STOP LISTENING" : "START LIVE MIC"}
      </button>
    </section>
  );
}
