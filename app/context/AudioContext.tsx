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

type AudioContextValue = {
  isPlaying: boolean;
  volume: number;
  playTrack: () => Promise<void>;
  pauseTrack: () => void;
  setVolumeLevel: (level: number) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const playTrack = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    if (!audio.paused) return;

    await audio.play();
  }, [volume]);

  const pauseTrack = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const setVolumeLevel = useCallback((level: number) => {
    const clamped = Math.min(1, Math.max(0, level));
    setVolume(clamped);

    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const value = useMemo(
    () => ({
      isPlaying,
      volume,
      playTrack,
      pauseTrack,
      setVolumeLevel,
    }),
    [isPlaying, volume, playTrack, pauseTrack, setVolumeLevel],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider.");
  }

  return context;
}
