"use client";

import { useEffect, useRef } from "react";
import { MonitorSmartphone, Settings, Video, VideoOff } from "lucide-react";
import LiveHubPreviewPlayer from "@/components/live-hub/LiveHubPreviewPlayer";
import { useLocalWebcam } from "@/hooks/useLocalWebcam";
import type { StudioEngineMode } from "@/lib/ops/studio-engine-mode";

export type RestreamCameraCardProps = {
  urlExists: boolean;
  isStreaming: boolean;
  hlsUrl?: string | null;
  engineMode: StudioEngineMode;
  onLocalAudioUpdate?: (db: number) => void;
  onConfigClick: () => void;
};

export default function RestreamCameraCard({
  urlExists,
  isStreaming,
  hlsUrl = null,
  engineMode,
  onLocalAudioUpdate,
  onConfigClick,
}: RestreamCameraCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInternalStudio = engineMode === "internal_studio";
  const trimmedHls = hlsUrl?.trim() ?? "";

  const localStream = useLocalWebcam(isInternalStudio, onLocalAudioUpdate);
  const localPreviewActive = isInternalStudio && localStream != null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !localStream || !isInternalStudio) return;

    video.srcObject = localStream;
    void video.play().catch(() => undefined);
  }, [isInternalStudio, localStream]);

  const showLiveBadge = isInternalStudio ? localPreviewActive : isStreaming;

  const liveBadge = isInternalStudio
    ? localPreviewActive
      ? "LIVE · NATIVE FEED"
      : "⚪ Idle (Practice Mode Only)"
    : showLiveBadge
      ? "🟢 Camera Connected & Active"
      : "⚪ Idle (Practice Mode Only)";

  const footerType = isInternalStudio
    ? "Type: Testing Camera"
    : "Source: External Field Camera";

  const borderAccent = isInternalStudio
    ? "border-brand-purple/40"
    : isStreaming
      ? "border-brand-pink/40"
      : "border-brand-border";

  return (
    <div
      className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-brand-panel p-3 text-white ${borderAccent}`}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isInternalStudio ? (
            <MonitorSmartphone
              className={`h-4 w-4 shrink-0 ${localPreviewActive ? "text-brand-purple" : "text-brand-muted"}`}
              aria-hidden="true"
            />
          ) : (
            <Video
              className={`h-4 w-4 shrink-0 ${isStreaming ? "animate-pulse text-brand-pink" : "text-brand-muted"}`}
              aria-hidden="true"
            />
          )}
          <span className="truncate font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em]">
            CAM 1: CAMERA GUY
          </span>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-ui text-[0.45rem] font-bold uppercase ${
            showLiveBadge
              ? isInternalStudio
                ? "bg-brand-purple/20 text-brand-purple"
                : "bg-brand-pink/20 text-brand-pink"
              : "bg-brand-black text-brand-muted"
          }`}
        >
          {liveBadge}
        </span>
      </div>

      <div className="relative aspect-video min-w-0 w-full overflow-hidden rounded-lg border border-brand-border bg-brand-black">
        {isInternalStudio ? (
          localPreviewActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full rounded bg-black object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <MonitorSmartphone className="h-8 w-8 text-brand-purple" aria-hidden="true" />
              <p className="font-ui text-[0.52rem] text-brand-muted">
                Waiting for a local camera or phone feed to connect.
              </p>
            </div>
          )
        ) : trimmedHls ? (
          <LiveHubPreviewPlayer playbackUrl={trimmedHls} />
        ) : urlExists ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
            <Video className="h-8 w-8 text-brand-purple" aria-hidden="true" />
            <p className="font-ui text-[0.52rem] text-brand-muted">
              Private stream link saved — add your web preview link in Setup
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
            <VideoOff className="h-8 w-8 text-brand-muted" aria-hidden="true" />
            <p className="font-ui text-[0.52rem] text-brand-muted">
              No preview link yet — open Setup to connect the field camera.
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex min-w-0 items-center justify-between gap-2 font-ui text-[0.48rem] text-brand-muted">
        <span className="min-w-0 truncate">{footerType}</span>
        <button
          type="button"
          onClick={onConfigClick}
          className="touch-target inline-flex shrink-0 items-center gap-1 text-brand-purple transition hover:text-brand-pink"
        >
          <Settings className="h-3 w-3" aria-hidden="true" />
          <span className="font-bold uppercase tracking-[0.08em]">Setup</span>
        </button>
      </div>
    </div>
  );
}
