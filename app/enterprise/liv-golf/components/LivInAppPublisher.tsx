"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchLivLiveKitEgressReadiness,
  fetchLivLiveKitPublisherToken,
  startLivLiveKitEgress,
  stopLivLiveKitEgress,
} from "@/lib/enterprise/liv-golf/liv-livekit-client";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";
import {
  ConnectionState,
  LocalTrackPublication,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from "livekit-client";

type PublisherPhase = "idle" | "connecting" | "preview" | "egress_starting" | "live" | "stopping" | "error";

type LivInAppPublisherProps = {
  roomId?: string;
  disabled?: boolean;
  platformLive?: boolean;
  onBroadcastLive?: (hlsManifestUrl: string) => void;
  onBroadcastEnded?: () => void;
};

export default function LivInAppPublisher({
  roomId = LIV_GOLF_TOUR_MAIN_ROOM,
  disabled = false,
  platformLive = false,
  onBroadcastLive,
  onBroadcastEnded,
}: LivInAppPublisherProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const participantIdentityRef = useRef<string | null>(null);
  const egressIdRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<PublisherPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Start the in-app camera to publish into the LIV LiveKit room.",
  );
  const [hlsManifestUrl, setHlsManifestUrl] = useState<string | null>(null);
  const [egressBlockers, setEgressBlockers] = useState<string[]>([]);
  const [egressReadinessLoading, setEgressReadinessLoading] = useState(false);

  const detachPreview = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  const disconnectRoom = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (!room) return;

    room.removeAllListeners();
    try {
      room.localParticipant.trackPublications.forEach((publication: LocalTrackPublication) => {
        const track = publication.track;
        if (track) {
          track.stop();
          void room.localParticipant.unpublishTrack(track, true);
        }
      });
      await room.disconnect(true);
    } catch (disconnectError) {
      console.error("[LivInAppPublisher] disconnect failed:", disconnectError);
    } finally {
      detachPreview();
    }
  }, [detachPreview]);

  useEffect(() => {
    return () => {
      void disconnectRoom();
    };
  }, [disconnectRoom]);

  const refreshEgressReadiness = useCallback(async () => {
    setEgressReadinessLoading(true);
    try {
      const readiness = await fetchLivLiveKitEgressReadiness();
      setEgressBlockers(readiness.ready ? [] : readiness.blockers ?? []);
    } catch {
      setEgressBlockers(["Unable to verify LiveKit egress configuration."]);
    } finally {
      setEgressReadinessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phase === "preview" || phase === "live") {
      void refreshEgressReadiness();
    }
  }, [phase, refreshEgressReadiness]);

  const handleStartCamera = useCallback(async () => {
    if (disabled) return;

    setPhase("connecting");
    setError(null);
    setStatusMessage("Requesting publisher token and opening camera...");

    try {
      await disconnectRoom();

      const tokenPayload = await fetchLivLiveKitPublisherToken({
        roomName: roomId,
        displayName: "LIV Golf In-App Producer",
      });

      if (!tokenPayload.success || !tokenPayload.token || !tokenPayload.url || !tokenPayload.roomName) {
        throw new Error(tokenPayload.error ?? "Publisher token broker rejected the request.");
      }

      participantIdentityRef.current = tokenPayload.participantIdentity ?? null;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Disconnected) {
          setStatusMessage("Publisher disconnected from LiveKit room.");
        }
      });

      await room.connect(tokenPayload.url, tokenPayload.token, { autoSubscribe: false });
      await room.localParticipant.setCameraEnabled(true, {
        resolution: VideoPresets.h720.resolution,
      });
      await room.localParticipant.setMicrophoneEnabled(true);

      const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const cameraTrack = cameraPublication?.track;
      if (cameraTrack && videoRef.current) {
        cameraTrack.attach(videoRef.current);
        await videoRef.current.play().catch(() => undefined);
      }

      setPhase("preview");
      setStatusMessage(
        "Camera is publishing to LiveKit. Open to fans when ready to start HLS egress.",
      );
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : "Unable to start in-app publisher.";
      console.error("[LivInAppPublisher] start camera failed:", message);
      setPhase("error");
      setError(message);
      setStatusMessage("In-app publisher failed to start.");
      await disconnectRoom();
    }
  }, [disabled, disconnectRoom, roomId]);

  const handleOpenToFans = useCallback(async () => {
    if (disabled || phase !== "preview") return;

    const identity = participantIdentityRef.current;
    if (!identity) {
      setError("Publisher identity is missing. Restart the in-app camera.");
      setPhase("error");
      return;
    }

    setPhase("egress_starting");
    setError(null);
    setStatusMessage("Starting LiveKit HLS egress and opening fan viewports...");

    try {
      const egress = await startLivLiveKitEgress({
        roomName: roomId,
        participantIdentity: identity,
      });

      if (!egress.success) {
        throw new Error(egress.error ?? "LiveKit egress start failed.");
      }

      const manifest = egress.hlsManifestUrl?.trim() ?? "";
      if (!manifest) {
        throw new Error("Egress started without a valid HLS manifest URL.");
      }

      egressIdRef.current = egress.egressId ?? null;
      setHlsManifestUrl(manifest);
      setPhase("live");
      setStatusMessage(
        egress.message ??
          "Broadcast is live on the platform. Fans can watch on /enterprise/liv-golf/live.",
      );
      onBroadcastLive?.(manifest);
    } catch (egressError) {
      const message =
        egressError instanceof Error ? egressError.message : "Unable to start HLS egress.";
      console.error("[LivInAppPublisher] open to fans failed:", message);
      const isConcurrentLimit = /concurrent egress|egress limit reached|egress slots still in use/i.test(message);
      setPhase(isConcurrentLimit ? "preview" : "error");
      setError(message);
      setStatusMessage(
        isConcurrentLimit
          ? "A previous LiveKit egress is still running. Click End Broadcast, wait ~30s, then try Open to Fans again."
          : "Failed to open fan viewports.",
      );
    }
  }, [disabled, onBroadcastLive, phase, roomId]);

  const handleEndBroadcast = useCallback(async () => {
    if (disabled) return;

    setPhase("stopping");
    setError(null);
    setStatusMessage("Stopping LiveKit egress and settling broadcast...");

    try {
      const stopResult = await stopLivLiveKitEgress(egressIdRef.current);
      if (!stopResult.success) {
        throw new Error(stopResult.error ?? "LiveKit egress stop failed.");
      }

      egressIdRef.current = null;
      setHlsManifestUrl(null);
      await disconnectRoom();

      setPhase("idle");
      setError(null);
      setStatusMessage(
        stopResult.message ??
          (stopResult.remainingActiveEgressIds?.length
            ? `Broadcast ended. Waiting for LiveKit to release ${stopResult.remainingActiveEgressIds.length} egress slot(s) — wait ~30s before Open to Fans.`
            : stopResult.egressAlreadyTerminal
              ? "Broadcast ended. LiveKit egress had already failed — verify S3 upload permissions before retrying."
              : "Broadcast ended. Camera publisher is offline."),
      );
      onBroadcastEnded?.();
    } catch (stopError) {
      const message =
        stopError instanceof Error ? stopError.message : "Unable to end broadcast.";
      console.error("[LivInAppPublisher] end broadcast failed:", message);
      setPhase("error");
      setError(message);
      setStatusMessage("Failed to end broadcast cleanly.");
    }
  }, [disabled, disconnectRoom, onBroadcastEnded]);

  const wasPlatformLiveRef = useRef(platformLive);

  useEffect(() => {
    const wasLive = wasPlatformLiveRef.current;
    wasPlatformLiveRef.current = platformLive;

    if (!wasLive || platformLive) return;
    if (phase === "idle" || phase === "connecting" || phase === "stopping") return;

    void (async () => {
      egressIdRef.current = null;
      setHlsManifestUrl(null);
      await disconnectRoom();
      setPhase("idle");
      setError(null);
      setStatusMessage("Broadcast ended from production controls. Camera publisher is offline.");
    })();
  }, [disconnectRoom, platformLive, phase]);

  const canEndBroadcast =
    phase === "live" || phase === "preview" || phase === "error" || platformLive;
  const isBusy =
    phase === "connecting" || phase === "egress_starting" || phase === "stopping";
  const egressReady = egressBlockers.length === 0;

  return (
    <section className="rounded-xl border border-[#CCFF00]/30 bg-[#101010] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#CCFF00]">
            In-App Broadcast
          </p>
          <h2 className="text-sm font-semibold text-white">LiveKit Camera Publisher</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Instagram-style platform-owned ingest — browser camera → LiveKit → HLS fans.
          </p>
        </div>
        <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-300">
          {phase === "live"
            ? "LIVE ON PLATFORM"
            : phase === "preview"
              ? "PUBLISHING"
              : phase === "connecting" || phase === "egress_starting"
                ? "SYNCING"
                : phase === "error"
                  ? "ERROR"
                  : "STANDBY"}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          autoPlay
          muted
          playsInline
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-zinc-300">{statusMessage}</p>

      {phase === "preview" && !egressReadinessLoading && !egressReady ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
            Open to Fans — setup required
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
            {egressBlockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hlsManifestUrl ? (
        <p className="mt-2 break-all font-mono text-[11px] text-emerald-300">
          HLS: {hlsManifestUrl}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled || isBusy || phase === "preview" || phase === "live"}
          onClick={() => void handleStartCamera()}
          className="rounded-lg bg-[#CCFF00] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#bce600] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "connecting" ? "Starting Camera..." : "Start Camera"}
        </button>

        <button
          type="button"
          disabled={disabled || isBusy || phase !== "preview" || !egressReady}
          onClick={() => void handleOpenToFans()}
          className="rounded-lg border border-[#CCFF00]/60 bg-[#CCFF00]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#CCFF00] transition hover:bg-[#CCFF00]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "egress_starting" ? "Opening Fans..." : "Open to Fans"}
        </button>

        <button
          type="button"
          disabled={disabled || isBusy || !canEndBroadcast}
          onClick={() => void handleEndBroadcast()}
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "stopping" ? "Ending..." : "End Broadcast"}
        </button>
      </div>
    </section>
  );
}
