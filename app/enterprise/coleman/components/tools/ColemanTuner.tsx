"use client";

import { useEffect, useRef, useState } from "react";

const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function createAudioContext(): AudioContext {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Web Audio API is unavailable.");
  }
  return new AudioCtx({ latencyHint: "interactive" });
}

function performAutocorrelationWithInterpolation(
  buffer: Float32Array,
  sampleRate: number,
): number {
  let size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i += 1) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) {
    return -1;
  }

  let r1 = 0;
  let r2 = size - 1;
  const thres = 0.2;
  for (let i = 0; i < size / 2; i += 1) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = size - 1; i >= size / 2; i -= 1) {
    if (Math.abs(buffer[i]) < thres) {
      r2 = i;
      break;
    }
  }

  const croppedBuffer = buffer.subarray(r1, r2);
  size = croppedBuffer.length;

  const correlation = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size - i; j += 1) {
      correlation[i] += croppedBuffer[j] * croppedBuffer[j + i];
    }
  }

  let d = 0;
  while (correlation[d] > correlation[d + 1]) {
    d += 1;
  }

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < size; i += 1) {
    if (correlation[i] > maxVal) {
      maxVal = correlation[i];
      maxPos = i;
    }
  }

  let period = maxPos;
  if (maxPos > 0 && maxPos < size - 1) {
    const alpha = correlation[maxPos - 1];
    const beta = correlation[maxPos];
    const gamma = correlation[maxPos + 1];
    const denominator = alpha - 2 * beta + gamma;
    if (denominator !== 0) {
      const peakOffset = 0.5 * (alpha - gamma) / denominator;
      period = maxPos + peakOffset;
    }
  }

  if (period <= 0) {
    return -1;
  }

  return sampleRate / period;
}

export default function ColemanTuner() {
  const [isListening, setIsListening] = useState(false);
  const [noteName, setNoteName] = useState("—");
  const [centsOffset, setCentsOffset] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array>(new Float32Array(4096));

  const stopTuning = () => {
    setIsListening(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setNoteName("—");
    setCentsOffset(0);
    setFrequency(0);
  };

  useEffect(() => {
    return () => stopTuning();
  }, []);

  const updatePitchLoop = () => {
    if (!analyserRef.current || !audioCtxRef.current) {
      return;
    }

    const buffer = bufferRef.current;
    analyserRef.current.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);

    const sampleRate = audioCtxRef.current.sampleRate;
    const pitchHz = performAutocorrelationWithInterpolation(buffer, sampleRate);

    if (pitchHz > 30 && pitchHz < 2000) {
      setFrequency(pitchHz);

      const midiNote = 12 * Math.log2(pitchHz / 440) + 69;
      const roundedMidi = Math.round(midiNote);
      const cents = Math.round((midiNote - roundedMidi) * 100);
      const parsedNoteName = CHROMATIC_NOTES[((roundedMidi % 12) + 12) % 12];

      setNoteName(parsedNoteName);
      setCentsOffset(cents);
    }

    rafIdRef.current = requestAnimationFrame(updatePitchLoop);
  };

  const startTuning = async () => {
    setError(null);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      audioCtxRef.current = createAudioContext();
      await audioCtxRef.current.resume();

      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0;

      const source = audioCtxRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);

      setIsListening(true);
      rafIdRef.current = requestAnimationFrame(updatePitchLoop);
    } catch {
      setError("Microphone access is required for live tuning.");
      stopTuning();
    }
  };

  const isInTune = Math.abs(centsOffset) <= 2 && noteName !== "—";

  return (
    <div className="coleman-tool-card text-center">
      <h2 className="mb-8 text-sm font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
        Chromatic Tuner
      </h2>

      {error ? (
        <p className="mb-4 text-xs text-[var(--coleman-accent-lime-soft)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="relative mb-4 flex h-24 items-center justify-center">
        <span
          className={`text-7xl font-light tracking-tight transition-colors duration-300 ${
            isInTune ? "text-[var(--coleman-accent-lime)] shadow-[var(--coleman-glow-lime)]" : "text-[var(--coleman-text-primary)]"
          }`}
        >
          {noteName}
        </span>
      </div>

      <div className="mb-8 font-mono text-xs tracking-[0.14em] text-[var(--coleman-text-muted)]">
        {frequency > 0 ? `${frequency.toFixed(1)} Hz` : "STILLNESS EXPECTED"}
      </div>

      <div className="relative mb-8 h-6 w-full overflow-hidden rounded-full border border-[var(--coleman-border-subtle)] bg-[rgba(0,0,0,0.32)]">
        <div
          className={`absolute bottom-0 top-0 transition-all duration-75 ${
            isInTune
              ? "w-1.5 bg-[var(--coleman-accent-lime)] shadow-[var(--coleman-glow-lime)]"
              : "w-1 bg-[var(--coleman-champagne)]"
          }`}
          style={{ left: `calc(${((centsOffset + 50) / 100) * 100}% - 2px)` }}
        />
        <div className="absolute bottom-0 left-1/2 top-0 w-0.5 bg-[var(--coleman-accent-lime)]" />
      </div>

      <div className="mb-8 flex justify-between px-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
        <span>-50♭</span>
        <span className={isInTune ? "text-[var(--coleman-accent-lime)]" : ""}>IN TUNE</span>
        <span>+50♯</span>
      </div>

      <button
        type="button"
        onClick={() => (isListening ? stopTuning() : void startTuning())}
        className={`w-full rounded-xl border py-4 text-sm font-medium transition ${
          isListening
            ? "border-[var(--coleman-accent-lime)] bg-transparent text-[var(--coleman-accent-lime)] hover:bg-[rgba(151,229,58,0.08)]"
            : "border-[var(--coleman-glass-border)] bg-[var(--coleman-glass-smoky)] text-[var(--coleman-text-primary)] shadow-[var(--coleman-shadow-control)] hover:border-[var(--coleman-champagne)]"
        }`}
      >
        {isListening ? "DISCONNECT INTERFACE" : "INITIALIZE INSTRUMENT MIC"}
      </button>
    </div>
  );
}
