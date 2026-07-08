"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import {
  detectPitch,
  estimateKeyFromFrequency,
} from "@/app/enterprise/coleman/lib/audio/pitch";

export default function ColemanKeyFinder() {
  const [active, setActive] = useState(false);
  const [detectedKey, setDetectedKey] = useState("—");
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
    setActive(false);
    setDetectedKey("—");
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
        setDetectedKey(estimateKeyFromFrequency(frequency));
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setError("Microphone access is required for key detection.");
    }
  };

  return (
    <section className="coleman-glass-panel coleman-tool-panel">
      <h1 className="coleman-tool-title">KEY FINDER</h1>
      <p className="coleman-tool-sub">Detect the tonal center from live audio</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <div className="coleman-key-display">{detectedKey}</div>

      <button
        type="button"
        className={`coleman-primary-btn coleman-icon-stroke${active ? " is-active" : ""}`}
        onClick={() => (active ? stopListening() : void startListening())}
      >
        {active ? <MicOff size={18} strokeWidth={1.25} /> : <Mic size={18} strokeWidth={1.25} />}
        {active ? "STOP DETECTING" : "DETECT KEY"}
      </button>
    </section>
  );
}
