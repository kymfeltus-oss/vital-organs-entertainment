"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import {
  getScenarioPlaybackUrl,
  resolveScenarioVideoSource,
} from "@/lib/enterprise/liv-golf/scenario-video-sources";
import { isShowcaseBetId } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import type { OverlayServerSession } from "@/app/enterprise/liv-golf/components/micro-betting-overlay/types";

export type VideoOverlayPlayerProps = {
  serverSession: OverlayServerSession | null;
  children: React.ReactNode;
  /** Rendered when no showcase scenario is driving the video lane (live HLS path). */
  liveStream?: React.ReactNode;
  className?: string;
};

function sessionMarketId(session: OverlayServerSession | null): string | null {
  if (!session?.active_bet_id || !session.is_active) return null;
  return session.active_bet_id;
}

export const VideoOverlayPlayer = React.memo(function VideoOverlayPlayer({
  serverSession,
  children,
  liveStream,
  className = "",
}: VideoOverlayPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);

  const marketId = sessionMarketId(serverSession);
  const scenarioSource = useMemo(() => resolveScenarioVideoSource(marketId), [marketId]);
  const isShowcaseFeed = Boolean(scenarioSource && isShowcaseBetId(marketId));

  const videoSrc = useMemo(() => {
    if (!scenarioSource) return "";
    return getScenarioPlaybackUrl(scenarioSource, useFallbackSrc);
  }, [scenarioSource, useFallbackSrc]);

  useEffect(() => {
    if (!isShowcaseFeed) {
      setUseFallbackSrc(false);
      setIsPlaying(true);
      return;
    }

    setUseFallbackSrc(false);
    setIsPlaying(true);
  }, [marketId, isShowcaseFeed]);

  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    const video = videoRef.current;
    video.currentTime = 0;

    const playPromise = video.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [videoSrc]);

  useEffect(() => {
    if (serverSession?.phase === "LOCKED" && videoRef.current) {
      void videoRef.current.play().catch(() => undefined);
    }
  }, [serverSession?.phase]);

  const handleVideoError = useCallback(() => {
    if (!useFallbackSrc) {
      setUseFallbackSrc(true);
    }
  }, [useFallbackSrc]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      void videoRef.current.play().then(() => setIsPlaying(true)).catch(() => undefined);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [isMuted]);

  const requestFullscreen = useCallback(() => {
    const target = videoRef.current?.parentElement;
    if (!target?.requestFullscreen) return;
    void target.requestFullscreen().catch(() => undefined);
  }, []);

  const feedLabel = marketId ?? "IDLE";
  const phaseLabel = serverSession?.phase ?? "STANDBY";

  return (
    <div
      className={`group relative aspect-video w-full overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl ${className}`}
    >
      {isShowcaseFeed && scenarioSource && videoSrc ? (
        <video
          ref={videoRef}
          key={videoSrc}
          src={videoSrc}
          className="h-full w-full object-cover"
          autoPlay
          muted={isMuted}
          playsInline
          loop
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      ) : liveStream ? (
        <div className="absolute inset-0">{liveStream}</div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/40 text-neutral-600">
          <div className="mb-2 animate-pulse text-xs font-black uppercase tracking-widest text-[#CCFF00]">
            Standby For Broadcast Lane
          </div>
          <span className="text-[11px]">Select a video scenario from the studio console panel</span>
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2">
        {isShowcaseFeed ? (
          <>
            <span className="liv-live-dot h-2 w-2 rounded-full bg-red-500" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              Showcase Feed
            </span>
          </>
        ) : null}
      </div>

      <div className="pointer-events-auto absolute bottom-4 right-4 top-4 z-30 w-[min(100%,340px)] max-sm:left-4 max-sm:w-auto">
        {children}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex h-16 items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent px-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto flex items-center gap-4">
          {isShowcaseFeed ? (
            <>
              <button
                type="button"
                onClick={togglePlay}
                className="transition-colors hover:text-[#CCFF00]"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-white" aria-hidden />
                ) : (
                  <Play className="h-4 w-4 fill-white" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="transition-colors hover:text-[#CCFF00]"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" aria-hidden />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            </>
          ) : null}
          <div className="rounded border border-neutral-800 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
            Feed: {feedLabel} · {phaseLabel}
          </div>
          {useFallbackSrc && isShowcaseFeed ? (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
              CDN fallback
            </span>
          ) : null}
        </div>

        <div className="pointer-events-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          {isShowcaseFeed ? (
            <button
              type="button"
              onClick={requestFullscreen}
              className="transition-colors hover:text-[#CCFF00]"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          LIV Virtual Egress
        </div>
      </div>
    </div>
  );
});

VideoOverlayPlayer.displayName = "VideoOverlayPlayer";
