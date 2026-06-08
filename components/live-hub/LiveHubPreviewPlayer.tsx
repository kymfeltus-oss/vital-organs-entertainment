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

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
      void video.play().catch(() => undefined);
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      return;
    }

    const hls = new Hls({ enableWorker: true });
    hlsRef.current = hls;
    hls.loadSource(playbackUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      void video.play().catch(() => undefined);
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [playbackUrl]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      playsInline
      muted
      controls
      aria-label="Operator live stream preview"
    />
  );
}
