"use client";

import { useEffect, useMemo, useState } from "react";

export type LiveStreamState = {
  streamId: string;
  hostName: string;
  hostInitials: string;
  isLive: boolean;
  viewerCount: number;
  elapsedSeconds: number;
  seedBalance: number;
  topSupporter: { name: string; amount: number };
  videoUrl: string | null;
  posterUrl: string | null;
};

type MockStreamConfig = {
  hostName: string;
  hostInitials: string;
  viewerCount: number;
  seedBalance: number;
  topSupporter: { name: string; amount: number };
  videoUrl: string | null;
  posterUrl: string | null;
  elapsedStartSeconds: number;
};

// TODO: Replace mock config with `/api/stream/manifest` + live_stream_state when backend is ready.
function resolveMockStream(streamId: string): MockStreamConfig {
  return {
    hostName: "Ian Craig",
    hostInitials: "IC",
    viewerCount: 201,
    seedBalance: 250,
    topSupporter: { name: "Keisha R.", amount: 100 },
    videoUrl: null,
    posterUrl: "/effects/hero-audience-banner.png",
    elapsedStartSeconds: 42 * 60 + 17,
  };
}

export function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function useLiveStream(streamId: string): LiveStreamState {
  const mock = useMemo(() => resolveMockStream(streamId), [streamId]);
  const [elapsedSeconds, setElapsedSeconds] = useState(mock.elapsedStartSeconds);
  const [viewerCount, setViewerCount] = useState(mock.viewerCount);

  useEffect(() => {
    setElapsedSeconds(mock.elapsedStartSeconds);
    setViewerCount(mock.viewerCount);
  }, [mock.elapsedStartSeconds, mock.viewerCount, streamId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
      setViewerCount((current) => current + (Math.random() > 0.7 ? 1 : 0));
    }, 1_000);
    return () => clearInterval(timer);
  }, []);

  return {
    streamId,
    hostName: mock.hostName,
    hostInitials: mock.hostInitials,
    isLive: true,
    viewerCount,
    elapsedSeconds,
    seedBalance: mock.seedBalance,
    topSupporter: mock.topSupporter,
    videoUrl: mock.videoUrl,
    posterUrl: mock.posterUrl,
  };
}
