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

const AUDIO_SRC = "/audio/awakening-teaser.m4a";
const DEFAULT_VOLUME = 0.85;
const STREAM_FADE_MS = 400;

type AudioContextValue = {
  isPlaying: boolean;
  volume: number;
  playTrack: () => Promise<void>;
  pauseTrack: () => void;
  setVolumeLevel: (level: number) => void;
  /** Duck or restore background music for the Live Stream Room (Tab 1). */
  setLiveStreamActive: (active: boolean) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

function clampVolume(level: number): number {
  return Math.max(0, Math.min(1, level));
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const baseVolumeRef = useRef(DEFAULT_VOLUME);
  const liveStreamActiveRef = useRef(false);
  const resumeAfterStreamRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const cancelFade = useCallback(() => {
    if (fadeRafRef.current !== null) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  }, []);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio(AUDIO_SRC);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = baseVolumeRef.current;

      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));

      audioRef.current = audio;
    }

    return audioRef.current;
  }, []);

  const fadeVolumeTo = useCallback(
    (targetVolume: number, onComplete?: () => void) => {
      const audio = getAudio();
      cancelFade();

      const startVolume = audio.volume;
      const fadeStart = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - fadeStart) / STREAM_FADE_MS, 1);
        const nextVolume = startVolume + (targetVolume - startVolume) * progress;
        audio.volume = nextVolume;
        setVolume(nextVolume);

        if (progress < 1) {
          fadeRafRef.current = requestAnimationFrame(step);
        } else {
          fadeRafRef.current = null;
          onComplete?.();
        }
      };

      fadeRafRef.current = requestAnimationFrame(step);
    },
    [cancelFade, getAudio],
  );

  const playTrack = useCallback(async () => {
    if (liveStreamActiveRef.current) return;

    const audio = getAudio();
    audio.volume = baseVolumeRef.current;
    setVolume(baseVolumeRef.current);

    try {
      await audio.play();
    } catch {
      /* blocked until user gesture */
    }
  }, [getAudio]);

  const pauseTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const setVolumeLevel = useCallback(
    (level: number) => {
      const clamped = clampVolume(level);
      baseVolumeRef.current = clamped;

      if (liveStreamActiveRef.current) return;

      const audio = getAudio();
      audio.volume = clamped;
      setVolume(clamped);
    },
    [getAudio],
  );

  const setLiveStreamActive = useCallback(
    (active: boolean) => {
      if (active === liveStreamActiveRef.current) return;

      liveStreamActiveRef.current = active;
      const audio = getAudio();

      if (active) {
        resumeAfterStreamRef.current = !audio.paused;
        cancelFade();
        fadeVolumeTo(0, () => {
          audio.pause();
        });
        return;
      }

      cancelFade();
      audio.volume = baseVolumeRef.current;
      setVolume(baseVolumeRef.current);

      if (resumeAfterStreamRef.current) {
        void audio.play().catch(() => {
          /* gesture may be required on some routes */
        });
      }
    },
    [cancelFade, fadeVolumeTo, getAudio],
  );

  useEffect(() => {
    getAudio();

    return () => {
      cancelFade();
      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [cancelFade, getAudio]);

  const value = useMemo<AudioContextValue>(
    () => ({
      isPlaying,
      volume,
      playTrack,
      pauseTrack,
      setVolumeLevel,
      setLiveStreamActive,
    }),
    [isPlaying, volume, playTrack, pauseTrack, setVolumeLevel, setLiveStreamActive],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }

  return context;
}
