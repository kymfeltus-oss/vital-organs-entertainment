"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import type { ExperienceHubAmbientTrack } from "@/lib/experience/hub-content";
import { HUB_SPEC_COLORS, HUB_SPEC_GLOWS, hubSpecClasses } from "@/lib/experience/hub-design-tokens";

type ExperienceHubAmbientDrawerProps = {
  tracks: ExperienceHubAmbientTrack[];
};

export default function ExperienceHubAmbientDrawer({
  tracks,
}: ExperienceHubAmbientDrawerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackIndexRef = useRef(0);
  const resumeAfterAdvanceRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const activeTrack = tracks[trackIndex] ?? tracks[0];

  const playCurrentTrack = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [activeTrack]);

  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    resumeAfterAdvanceRef.current = false;
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pausePlayback();
      return;
    }
    resumeAfterAdvanceRef.current = true;
    void playCurrentTrack();
  }, [isPlaying, pausePlayback, playCurrentTrack]);

  const advanceTrack = useCallback(() => {
    if (tracks.length <= 1) return;

    const nextIndex = (trackIndexRef.current + 1) % tracks.length;
    trackIndexRef.current = nextIndex;
    setTrackIndex(nextIndex);
    setIsReady(false);
  }, [tracks.length]);

  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);

  useEffect(() => {
    setIsReady(false);
    if (!resumeAfterAdvanceRef.current) {
      setIsPlaying(false);
    }
  }, [activeTrack?.id, activeTrack?.audioUrl]);

  useEffect(() => {
    if (!isReady || !resumeAfterAdvanceRef.current) return;
    void playCurrentTrack();
  }, [isReady, playCurrentTrack, trackIndex]);

  if (!activeTrack) return null;

  return (
    <div className="pointer-events-auto absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-[clamp(1rem,3vw,1.5rem)]">
      <div
        className={`glass-panel ${hubSpecClasses.gradientBorder} flex min-h-11 max-w-[min(72vw,18rem)] items-center gap-3 rounded-full px-3 py-2 backdrop-blur-xl`}
        style={{ boxShadow: HUB_SPEC_GLOWS.cyan }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#00E6FF12]"
          style={{ borderColor: `${HUB_SPEC_COLORS.cyan}66`, color: HUB_SPEC_COLORS.cyan }}
        >
          <Music2 className="h-4 w-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className={`truncate ${hubSpecClasses.label} text-[0.58rem] tracking-[0.14em] text-white`}>
            {activeTrack.title}
          </p>
          <div className="mt-1 flex h-3 items-end gap-0.5" aria-hidden="true">
            {[0.35, 0.7, 0.5, 0.85, 0.45].map((scale, index) => (
              <span
                key={index}
                className={`w-0.5 rounded-full ${isPlaying ? "animate-pulse" : "opacity-40"}`}
                style={{
                  height: `${scale * 100}%`,
                  backgroundColor: HUB_SPEC_COLORS.pink,
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={togglePlayback}
          disabled={!isReady && !isPlaying}
          className="touch-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-black/50 text-white transition hover:border-[#00E6FF66]"
          aria-label={isPlaying ? "Pause ambient track" : "Play ambient track"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          )}
        </button>
      </div>

      <audio
        key={activeTrack.id}
        ref={audioRef}
        src={activeTrack.audioUrl}
        preload="metadata"
        loop={tracks.length <= 1}
        onCanPlay={() => setIsReady(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (tracks.length <= 1) return;
          resumeAfterAdvanceRef.current = !audioRef.current?.paused;
          advanceTrack();
        }}
        className="sr-only"
      />
    </div>
  );
}
