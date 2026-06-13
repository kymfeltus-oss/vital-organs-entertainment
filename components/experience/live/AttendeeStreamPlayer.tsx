"use client";

import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const RECONNECT_DELAY_MS = 3_500;

type AttendeeStreamPlayerProps = {
  enabled: boolean;
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
};

export default function AttendeeStreamPlayer({
  enabled,
  showPaywall,
  paywallOverlay,
}: AttendeeStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const playbackUrlRef = useRef("");

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const shouldPlay = enabled && !showPaywall;

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

    try {
      const response = await fetch("/api/stream/manifest?experience=main_stage", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        scheduleReconnectRef.current();
        return null;
      }

      const data = (await response.json()) as {
        success?: boolean;
        playbackUrl?: string;
      };

      const playbackUrl = data.playbackUrl?.trim() ?? "";
      if (!data.success || !playbackUrl) {
        scheduleReconnectRef.current();
        return null;
      }

      playbackUrlRef.current = playbackUrl;
      return playbackUrl;
    } catch {
      scheduleReconnectRef.current();
      return null;
    }
  }, [shouldPlay]);

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

    setIsBuffering(true);
    void loadStream().then((url) => {
      if (url) bindSource(url);
    });

    return () => {
      clearReconnectTimer();
      destroyPlayer();
    };
  }, [bindSource, clearReconnectTimer, destroyPlayer, loadStream, shouldPlay]);

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
    <div className="relative aspect-video w-full overflow-hidden rounded-none bg-black md:rounded-xl md:border md:border-brand-border neon-blue-glow">
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full bg-black object-contain ${
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" aria-hidden="true" />
          <p className="mt-4 max-w-sm font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white">
            Reconnecting to live broadcast…
          </p>
        </div>
      )}

      {paywallOverlay}
    </div>
  );
}
