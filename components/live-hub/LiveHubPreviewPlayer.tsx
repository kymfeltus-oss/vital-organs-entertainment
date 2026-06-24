"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";

type LiveHubPreviewPlayerProps = {
  playbackUrl: string;
};

export default function LiveHubPreviewPlayer({
  playbackUrl,
}: LiveHubPreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const cleanupVideo = () => {
      video.removeAttribute("src");
      video.load();
    };

    // Prefer hls.js when available — Chromium often reports native HLS support via
    // canPlayType but cannot actually decode .m3u8 without MSE.
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: 0,
        capLevelToPlayerSize: true,
        abrEwmaDefaultEstimate: 500_000,
        maxLoadingDelay: 4,
      });
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => undefined);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
        cleanupVideo();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      void video.play().catch(() => undefined);
      return cleanupVideo;
    }

    return undefined;
  }, [playbackUrl]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      autoPlay
      playsInline
      muted
      controls
      aria-label="Operator live stream preview"
    />
  );
}
