"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import {
  getScenarioPlaybackUrl,
  resolveScenarioVideoSource,
} from "@/lib/enterprise/liv-golf/scenario-video-sources";
import { normalizeVideoAssetPath } from "@/lib/enterprise/liv-golf/simulation-video-path";
import { isShowcaseBetId } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import { LiveBetNotificationPill } from "@/app/enterprise/liv-golf/components/micro-betting-overlay/LiveBetNotificationPill";
import type { OverlayServerSession } from "@/app/enterprise/liv-golf/components/micro-betting-overlay/types";

export type VideoOverlayPlayerProps = {
  serverSession: OverlayServerSession | null;
  /** Ephemeral clip path from realtime launch broadcast (no DB column). */
  videoAssetPath?: string | null;
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
  videoAssetPath = null,
  children,
  liveStream,
  className = "",
}: VideoOverlayPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);
  const [isBettingEnabled, setIsBettingEnabled] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const lastMarketIdRef = useRef<string | null>(null);

  const marketId = sessionMarketId(serverSession);
  const dynamicVideoPath = useMemo(
    () => normalizeVideoAssetPath(videoAssetPath),
    [videoAssetPath],
  );
  const scenarioSource = useMemo(() => resolveScenarioVideoSource(marketId), [marketId]);
  const isShowcaseFeed = Boolean(
    dynamicVideoPath || (scenarioSource && isShowcaseBetId(marketId)),
  );

  const videoSrc = useMemo(() => {
    if (dynamicVideoPath) return dynamicVideoPath;
    if (!scenarioSource) return "";
    return getScenarioPlaybackUrl(scenarioSource, useFallbackSrc);
  }, [dynamicVideoPath, scenarioSource, useFallbackSrc]);

  useEffect(() => {
    if (!isShowcaseFeed) return;

    const probeTarget = dynamicVideoPath ?? scenarioSource?.localMp4;
    if (!probeTarget) return;

    setUseFallbackSrc(false);
    setIsPlaying(true);

    let cancelled = false;

    void fetch(probeTarget, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!cancelled && !response.ok) {
          setUseFallbackSrc(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUseFallbackSrc(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dynamicVideoPath, isShowcaseFeed, marketId, scenarioSource]);

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

  useEffect(() => {
    if (isBettingEnabled) {
      setShowNotification(false);
    }
  }, [isBettingEnabled]);

  useEffect(() => {
    const activeBetId = serverSession?.active_bet_id ?? null;
    if (!activeBetId || !serverSession?.is_active) {
      lastMarketIdRef.current = activeBetId;
      setShowNotification(false);
      return;
    }

    if (activeBetId === lastMarketIdRef.current) return;

    lastMarketIdRef.current = activeBetId;

    if (!isBettingEnabled && serverSession.phase === "OPEN") {
      setShowNotification(true);

      const timer = window.setTimeout(() => {
        setShowNotification(false);
      }, 4000);

      return () => window.clearTimeout(timer);
    }
  }, [
    serverSession?.active_bet_id,
    serverSession?.is_active,
    serverSession?.phase,
    isBettingEnabled,
  ]);

  const handleVideoError = useCallback(() => {
    setUseFallbackSrc((current) => {
      if (current) return current;
      return true;
    });
  }, []);

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

  const toggleBettingOverlay = useCallback(() => {
    setIsBettingEnabled((prev) => !prev);
  }, []);

  const handlePillAction = useCallback(() => {
    setShowNotification(false);
    setIsBettingEnabled(true);
  }, []);

  const feedLabel = marketId ?? "IDLE";
  const phaseLabel = serverSession?.phase ?? "STANDBY";

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden bg-neutral-950 shadow-2xl md:aspect-video md:rounded-3xl md:border md:border-neutral-800 ${className}`}
    >
      <div className="group relative aspect-video w-full shrink-0 overflow-hidden bg-black md:absolute md:inset-0 md:aspect-auto">
        <LiveBetNotificationPill
          serverSession={serverSession}
          isVisible={showNotification}
          onActionClick={handlePillAction}
        />

        {isShowcaseFeed && videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            className="h-full w-full object-contain object-center"
            autoPlay
            muted={isMuted}
            playsInline
            loop
            preload="auto"
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

        <div className="absolute inset-x-0 bottom-0 z-20 flex h-16 items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 text-white opacity-100 transition-opacity duration-300 sm:px-6 sm:opacity-0 sm:group-hover:opacity-100">
          <div className="pointer-events-auto flex items-center gap-3 sm:gap-4">
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
            <div className="hidden rounded border border-neutral-800 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider sm:inline">
              Feed: {feedLabel} · {phaseLabel}
            </div>
            {useFallbackSrc && isShowcaseFeed && scenarioSource ? (
              <span className="hidden text-[9px] font-bold uppercase tracking-wider text-amber-400 sm:inline">
                CDN fallback
              </span>
            ) : null}
          </div>

          <div className="pointer-events-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 sm:gap-3">
            <button
              type="button"
              onClick={toggleBettingOverlay}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all sm:px-3 sm:text-[10px] ${
                isBettingEnabled
                  ? "border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  : "border-[#CCFF00] bg-[#CCFF00] font-extrabold text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:bg-[#b5e000]"
              }`}
              aria-pressed={isBettingEnabled}
              aria-label={isBettingEnabled ? "Hide live bets overlay" : "Enable live bets overlay"}
            >
              {isBettingEnabled ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Hide Live Bets</span>
                  <span className="sm:hidden">Hide Bets</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Enable Live Bets</span>
                  <span className="sm:hidden">Show Bets</span>
                </>
              )}
            </button>
            {isShowcaseFeed ? (
              <button
                type="button"
                onClick={requestFullscreen}
                className="hidden transition-colors hover:text-[#CCFF00] sm:inline-flex"
                aria-label="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <span className="mr-1 hidden h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 sm:inline-block" />
            <span className="hidden sm:inline">LIV Virtual Egress</span>
          </div>
        </div>
      </div>

      {isBettingEnabled ? (
        <div className="pointer-events-auto h-[min(320px,42vh)] w-full shrink-0 transition-all duration-300 md:absolute md:inset-y-4 md:right-4 md:z-30 md:h-auto md:w-[min(100%,340px)]">
          {children}
        </div>
      ) : null}
    </div>
  );
});

VideoOverlayPlayer.displayName = "VideoOverlayPlayer";
