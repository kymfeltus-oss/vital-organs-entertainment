"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ColemanAudioContextValue = {
  currentlyPlayingTrackId: string | null;
  playTrack: (trackId: string, streamUrl: string) => Promise<void>;
  toggleTrack: (trackId: string, streamUrl: string) => Promise<void>;
  stopAll: () => void;
};

const ColemanAudioContext = createContext<ColemanAudioContextValue | null>(null);

export function ColemanAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentlyPlayingTrackId, setCurrentlyPlayingTrackId] = useState<string | null>(
    null,
  );

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentlyPlayingTrackId(null);
  }, []);

  const playTrack = useCallback(async (trackId: string, streamUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(streamUrl);
    audio.loop = true;
    await audio.play();
    audioRef.current = audio;
    setCurrentlyPlayingTrackId(trackId);
  }, []);

  const toggleTrack = useCallback(
    async (trackId: string, streamUrl: string) => {
      if (currentlyPlayingTrackId === trackId && audioRef.current) {
        stopAll();
        return;
      }
      await playTrack(trackId, streamUrl);
    },
    [currentlyPlayingTrackId, playTrack, stopAll],
  );

  const value = useMemo(
    () => ({
      currentlyPlayingTrackId,
      playTrack,
      toggleTrack,
      stopAll,
    }),
    [currentlyPlayingTrackId, playTrack, toggleTrack, stopAll],
  );

  return (
    <ColemanAudioContext.Provider value={value}>{children}</ColemanAudioContext.Provider>
  );
}

export function useColemanAudio() {
  const context = useContext(ColemanAudioContext);
  if (!context) {
    throw new Error("useColemanAudio must be used within ColemanAudioProvider.");
  }
  return context;
}
