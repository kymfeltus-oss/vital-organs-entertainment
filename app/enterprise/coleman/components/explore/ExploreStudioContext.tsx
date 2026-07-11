"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { ScaleMode, TheoryRootKey } from "@/app/enterprise/coleman/lib/tools/theory-matrix";

export type ExploreTimeSignature = "4/4" | "3/4" | "6/8";
export type ExploreNavId = "dashboard" | "tuner" | "metronome" | "theory" | "tracks" | "settings";

type ExploreStudioContextValue = {
  bpm: number;
  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  timeSignature: ExploreTimeSignature;
  setTimeSignature: (sig: ExploreTimeSignature) => void;
  isPlaying: boolean;
  currentBeat: number;
  scheduleStatus: string;
  play: () => void;
  stop: () => void;
  tapTempo: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  transportPlaying: boolean;
  toggleTransport: () => void;
  theoryKey: TheoryRootKey;
  setTheoryKey: (key: TheoryRootKey) => void;
  theoryScale: ScaleMode;
  setTheoryScale: (scale: ScaleMode) => void;
  activeNav: ExploreNavId;
  setActiveNav: (nav: ExploreNavId) => void;
  tunerNote: string;
  tunerHz: number;
  tunerCents: number;
  tunerLive: boolean;
};

const ExploreStudioContext = createContext<ExploreStudioContextValue | null>(null);

function createAudioContext(): AudioContext {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Web Audio unavailable");
  }
  return new AudioCtx({ latencyHint: "interactive" });
}

function beatsPerBar(sig: ExploreTimeSignature): number {
  if (sig === "3/4") return 3;
  if (sig === "6/8") return 6;
  return 4;
}

export function ExploreStudioProvider({ children }: { children: ReactNode }) {
  const [bpm, setBpmState] = useState(120);
  const [timeSignature, setTimeSignature] = useState<ExploreTimeSignature>("4/4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(72);
  const [transportPlaying, setTransportPlaying] = useState(false);
  const [theoryKey, setTheoryKey] = useState<TheoryRootKey>("G");
  const [theoryScale, setTheoryScale] = useState<ScaleMode>("major");
  const [activeNav, setActiveNav] = useState<ExploreNavId>("metronome");
  const [tunerNote, setTunerNote] = useState("E");
  const [tunerHz, setTunerHz] = useState(82.41);
  const [tunerCents, setTunerCents] = useState(1.3);
  const [tunerLive, setTunerLive] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  const bpmRef = useRef(bpm);
  const timeSigRef = useRef(timeSignature);

  const tunerRafRef = useRef<number | null>(null);
  const tunerStreamRef = useRef<MediaStream | null>(null);
  const tunerAnalyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    timeSigRef.current = timeSignature;
  }, [timeSignature]);

  const setBpm = useCallback((value: number) => {
    setBpmState(Math.max(40, Math.min(220, Math.round(value))));
  }, []);

  const nudgeBpm = useCallback((delta: number) => {
    setBpm(bpmRef.current + delta);
  }, [setBpm]);

  const stopEngine = useCallback(() => {
    setIsPlaying(false);
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setCurrentBeat(0);
  }, []);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const sig = timeSigRef.current;
    const isDownbeat = beatNumber === 0;
    const isSecondary = sig === "6/8" && beatNumber === 3;

    osc.frequency.setValueAtTime(isDownbeat ? 1000 : isSecondary ? 800 : 500, time);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.06);

    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    window.setTimeout(() => setCurrentBeat(beatNumber), delayMs);
  }, []);

  const advanceNote = useCallback(() => {
    const secondsPerBeat = 60 / bpmRef.current;
    const stepFactor = timeSigRef.current === "6/8" ? 0.5 : 1;
    nextNoteTimeRef.current += secondsPerBeat * stepFactor;
    const total = beatsPerBar(timeSigRef.current);
    beatRef.current = (beatRef.current + 1) % total;
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const lookAhead = 0.1;
    while (nextNoteTimeRef.current < ctx.currentTime + lookAhead) {
      scheduleNote(beatRef.current, nextNoteTimeRef.current);
      advanceNote();
    }
  }, [advanceNote, scheduleNote]);

  const play = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    const ctx = audioCtxRef.current;
    void ctx.resume();
    stopEngine();
    setIsPlaying(true);
    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    timerIdRef.current = window.setInterval(scheduler, 25);
    setTransportPlaying(true);
  }, [scheduler, stopEngine]);

  const stop = useCallback(() => {
    stopEngine();
    setTransportPlaying(false);
  }, [stopEngine]);

  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current.filter((t) => now - t < 2000);
    taps.push(now);
    tapTimesRef.current = taps;
    if (taps.length > 1) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60000 / avg));
    }
  }, [setBpm]);

  useEffect(() => {
    return () => {
      stopEngine();
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, [stopEngine]);

  useEffect(() => {
    let mounted = true;
    let micLive = false;

    const floatId = window.setInterval(() => {
      if (!micLive) {
        const target = 1.3 + Math.sin(Date.now() / 900) * 0.4;
        setTunerCents((prev) => prev + (target - prev) * 0.1);
      }
    }, 50);

    const startTuner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        const ctx = createAudioContext();
        await ctx.resume();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0;
        ctx.createMediaStreamSource(stream).connect(analyser);

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          void ctx.close();
          return;
        }

        micLive = true;
        setTunerLive(true);
        tunerStreamRef.current = stream;
        tunerAnalyserRef.current = analyser;

        const buffer = new Float32Array(analyser.fftSize);

        const tick = () => {
          if (!tunerAnalyserRef.current || !mounted) return;
          analyser.getFloatTimeDomainData(buffer);

          let rms = 0;
          for (let i = 0; i < buffer.length; i += 1) rms += buffer[i] * buffer[i];
          rms = Math.sqrt(rms / buffer.length);

          if (rms > 0.01) {
            const pitch = estimatePitch(buffer, ctx.sampleRate);
            if (pitch > 30 && pitch < 2000) {
              const midi = 12 * Math.log2(pitch / 440) + 69;
              const rounded = Math.round(midi);
              const cents = (midi - rounded) * 100;
              const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
              setTunerNote(notes[((rounded % 12) + 12) % 12]);
              setTunerHz(pitch);
              setTunerCents((prev) => prev + (cents - prev) * 0.15);
            }
          }

          tunerRafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch {
        micLive = false;
        setTunerLive(false);
      }
    };

    void startTuner();

    return () => {
      mounted = false;
      window.clearInterval(floatId);
      if (tunerRafRef.current) cancelAnimationFrame(tunerRafRef.current);
      tunerStreamRef.current?.getTracks().forEach((t) => t.stop());
      tunerStreamRef.current = null;
      tunerAnalyserRef.current = null;
    };
  }, []);

  const scheduleStatus = isPlaying
    ? "Running with Web Audio Clock"
    : "Standby — press Play to start";

  const value = useMemo<ExploreStudioContextValue>(
    () => ({
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
      volume,
      setVolume,
      transportPlaying,
      toggleTransport: () => (transportPlaying ? stop() : play()),
      theoryKey,
      setTheoryKey,
      theoryScale,
      setTheoryScale,
      activeNav,
      setActiveNav,
      tunerNote,
      tunerHz,
      tunerCents,
      tunerLive,
    }),
    [
      activeNav,
      bpm,
      currentBeat,
      isPlaying,
      nudgeBpm,
      play,
      scheduleStatus,
      setBpm,
      stop,
      tapTempo,
      theoryKey,
      theoryScale,
      timeSignature,
      transportPlaying,
      tunerCents,
      tunerHz,
      tunerLive,
      tunerNote,
      volume,
    ],
  );

  return <ExploreStudioContext.Provider value={value}>{children}</ExploreStudioContext.Provider>;
}

export function useExploreStudio() {
  const ctx = useContext(ExploreStudioContext);
  if (!ctx) {
    throw new Error("useExploreStudio must be used within ExploreStudioProvider");
  }
  return ctx;
}

function estimatePitch(buffer: Float32Array, sampleRate: number): number {
  const minLag = Math.floor(sampleRate / 2000);
  const maxLag = Math.min(Math.ceil(sampleRate / 30), buffer.length - 1);
  let bestLag = minLag;
  let best = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    for (let i = 0; i < buffer.length - lag; i += 1) sum += buffer[i] * buffer[i + lag];
    if (sum > best) {
      best = sum;
      bestLag = lag;
    }
  }
  return best > 0 ? sampleRate / bestLag : 0;
}

export function tempoMarking(bpm: number): string {
  if (bpm < 60) return "Largo";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  return "Presto";
}
