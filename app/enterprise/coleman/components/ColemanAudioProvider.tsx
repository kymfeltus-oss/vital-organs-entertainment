"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getStageRoutingManager } from "@/app/enterprise/coleman/lib/audio/stage-routing-manager";

type ColemanAudioContextValue = {
  currentlyPlayingTrackId: string | null;
  playTrack: (trackId: string, streamUrl: string) => Promise<void>;
  toggleTrack: (trackId: string, streamUrl: string) => Promise<void>;
  stopAll: () => void;
};

const ColemanAudioContext = createContext<ColemanAudioContextValue | null>(null);

export function ColemanAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unregisterSinkRef = useRef<(() => void) | null>(null);
  const [currentlyPlayingTrackId, setCurrentlyPlayingTrackId] = useState<string | null>(
    null,
  );

  const stopAll = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrentlyPlayingTrackId(null);
  }, []);

  useEffect(() => {
    const manager = getStageRoutingManager();
    void manager.initialize();
    manager.setHeadphoneUnplugHandler(() => {
      stopAll();
    });
  }, [stopAll]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    const manager = getStageRoutingManager();
    unregisterSinkRef.current = manager.registerMediaElement(audio);

    return () => {
      unregisterSinkRef.current?.();
      unregisterSinkRef.current = null;
    };
  }, []);

  const playTrack = useCallback(async (trackId: string, streamUrl: string) => {
    const audio = audioRef.current;
    if (!audio) {
      throw new Error("Playback element is unavailable.");
    }

    audio.pause();
    audio.src = streamUrl;
    audio.loop = true;

    const manager = getStageRoutingManager();
    await manager.setRoutingProfile(manager.getState().routingProfile);

    try {
      await audio.play();
    } catch (error) {
      audio.removeAttribute("src");
      audio.load();
      throw error;
    }

    setCurrentlyPlayingTrackId(trackId);
  }, []);

  const toggleTrack = useCallback(
    async (trackId: string, streamUrl: string) => {
      if (currentlyPlayingTrackId === trackId && audioRef.current && !audioRef.current.paused) {
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
    <ColemanAudioContext.Provider value={value}>
      <audio ref={audioRef} className="sr-only" aria-hidden playsInline preload="auto" />
      {children}
    </ColemanAudioContext.Provider>
  );
}

export function useColemanAudio() {
  const context = useContext(ColemanAudioContext);
  if (!context) {
    throw new Error("useColemanAudio must be used within ColemanAudioProvider.");
  }
  return context;
}
