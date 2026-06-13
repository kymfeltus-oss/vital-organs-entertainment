"use client";

import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_ATTENDEE_EXPERIENCE,
  type AttendeeExperienceKey,
} from "@/lib/experience/stream-experiences";

const RECONNECT_DELAY_MS = 3_500;

type AttendeeStreamPlayerProps = {
  experience?: AttendeeExperienceKey;
  enabled: boolean;
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  onExperienceUnavailable?: (requested: AttendeeExperienceKey) => void;
  /** Render inside StreamStageChrome wrapper (no outer frame). */
  embedded?: boolean;
};

export default function AttendeeStreamPlayer({
  experience = DEFAULT_ATTENDEE_EXPERIENCE,
  enabled,
  showPaywall,
  paywallOverlay,
  onExperienceUnavailable,
  embedded = false,
}: AttendeeStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const playbackUrlRef = useRef("");
  const experienceRef = useRef(experience);
  const onUnavailableRef = useRef(onExperienceUnavailable);

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const shouldPlay = enabled && !showPaywall;

  useEffect(() => {
    experienceRef.current = experience;
  }, [experience]);

  useEffect(() => {
    onUnavailableRef.current = onExperienceUnavailable;
  }, [onExperienceUnavailable]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  const scheduleReconnectRef = useRef<() => void>(() => undefined);
  const loadStreamRef = useRef<() => Promise<string | null>>(async () => null);
  const bindSourceRef = useRef<(url: string) => void>(() => undefined);

  const notifyExperienceUnavailable = useCallback(() => {
    const requested = experienceRef.current;
    if (requested === DEFAULT_ATTENDEE_EXPERIENCE) return;
    onUnavailableRef.current?.(requested);
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!shouldPlay || !isMountedRef.current) return;
    clearReconnectTimer();
    setIsReconnecting(true);
    setIsPlaying(false);
    setIsBuffering(true);

    reconnectTimerRef.current = setTimeout(() => {
      void loadStreamRef.current().then((url) => {
        if (!isMountedRef.current) return;
        if (url) {
          bindSourceRef.current(url);
          return;
        }
        scheduleReconnectRef.current();
      });
    }, RECONNECT_DELAY_MS);
  }, [clearReconnectTimer, shouldPlay]);

  const bindSource = useCallback(
    (sourceUrl: string) => {
      const video = videoRef.current;
      if (!video || !sourceUrl || !shouldPlay) return;

      destroyPlayer();

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        void video.play().catch(() => scheduleReconnectRef.current());
        return;
      }

      if (!Hls.isSupported()) {
        scheduleReconnectRef.current();
        return;
      }

      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsReconnecting(false);
        setIsBuffering(false);
        void video.play().catch(() => scheduleReconnectRef.current());
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        scheduleReconnectRef.current();
      });
    },
    [destroyPlayer, shouldPlay],
  );

  const loadStream = useCallback(async (): Promise<string | null> => {
    if (!shouldPlay) return null;

    const requestedExperience = experienceRef.current;

    try {
      const response = await fetch(
        `/api/stream/manifest?experience=${encodeURIComponent(requestedExperience)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        if (
          requestedExperience !== DEFAULT_ATTENDEE_EXPERIENCE &&
          (response.status === 503 || response.status === 400)
        ) {
          notifyExperienceUnavailable();
          return null;
        }
        scheduleReconnectRef.current();
        return null;
      }

      const data = (await response.json()) as {
        success?: boolean;
        playbackUrl?: string;
      };

      const playbackUrl = data.playbackUrl?.trim() ?? "";
      if (!data.success || !playbackUrl) {
        if (requestedExperience !== DEFAULT_ATTENDEE_EXPERIENCE) {
          notifyExperienceUnavailable();
          return null;
        }
        scheduleReconnectRef.current();
        return null;
      }

      playbackUrlRef.current = playbackUrl;
      return playbackUrl;
    } catch {
      scheduleReconnectRef.current();
      return null;
    }
  }, [notifyExperienceUnavailable, shouldPlay]);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
    loadStreamRef.current = loadStream;
    bindSourceRef.current = bindSource;
  }, [bindSource, loadStream, scheduleReconnect]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldPlay) {
      clearReconnectTimer();
      destroyPlayer();
      setIsReconnecting(false);
      setIsBuffering(false);
      setIsPlaying(false);
      playbackUrlRef.current = "";
      return;
    }

    setIsReconnecting(false);
    setIsBuffering(true);
    setIsPlaying(false);
    void loadStream().then((url) => {
      if (url) bindSource(url);
    });

    return () => {
      clearReconnectTimer();
      destroyPlayer();
    };
  }, [
    bindSource,
    clearReconnectTimer,
    destroyPlayer,
    experience,
    loadStream,
    shouldPlay,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldPlay) return;

    const onPlaying = () => {
      setIsPlaying(true);
      setIsReconnecting(false);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onError = () => scheduleReconnectRef.current();

    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
    };
  }, [shouldPlay]);

  if (!shouldPlay) return null;

  const showRecovery = isReconnecting || isBuffering || !isPlaying;

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-black ${
        embedded
          ? ""
          : "experience-stream-stage rounded-none md:rounded-xl md:border md:border-brand-border neon-blue-glow"
      }`}
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 z-0 h-full w-full bg-black object-cover ${
          isPlaying && !showRecovery ? "opacity-100" : "opacity-0"
        }`}
        controls={isPlaying && !showRecovery}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
        autoPlay
        muted
      />

      {showRecovery && (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center bg-brand-panel/95 px-6 text-center">
          <div className="flex h-8 items-end justify-center gap-1" aria-hidden="true">
            <span className="live-waveform-bar w-1 rounded-full bg-brand-blue/70" style={{ animationDelay: "0ms" }} />
            <span className="live-waveform-bar w-1 rounded-full bg-brand-blue/70" style={{ animationDelay: "150ms" }} />
            <span className="live-waveform-bar w-1 rounded-full bg-brand-blue/70" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="mt-4 max-w-sm font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-300">
            Reconnecting to live broadcast…
          </p>
        </div>
      )}

      {paywallOverlay}
    </div>
  );
}
