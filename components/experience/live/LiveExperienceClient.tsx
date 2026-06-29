"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { fetchLiveAccessEvaluation, type LiveAccessEvaluation } from "@/lib/access";
import { resolveImminentLiveRemainingSeconds } from "@/lib/experience/imminent-live-countdown";
import { attachHlsPlayback } from "@/lib/live/attach-hls-playback";
import { requestLiveSeedWalletRefresh } from "@/lib/live/seed-wallet-events";
import { getSupabase } from "@/lib/supabase/client";
import ImminentLiveOverlay from "@/components/experience/ImminentLiveOverlay";
import {
  clearDirectCameraChannelSignals,
  createDirectCameraClientId,
  createDirectCameraPeer,
  markDirectCameraChannelJoined,
  sendDirectCameraSignal,
  tryFlushDirectCameraChannelSignals,
  type DirectCameraSignal,
} from "@/lib/experience/direct-camera-live";
import { resolvePublisherBrowserChannel } from "@/lib/owner/direct-camera-channels";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  isPlatformChannelSubscribed,
  registerPlatformListener,
  releasePlatformChannel,
  resubscribePlatformChannel,
  subscribePlatformChannelStatus,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { STALE_REALTIME_SUBSCRIBE_STATUSES } from "@/lib/live/realtime-subscribe";
import {
  IMMINENT_LIVE_DURATION_SEC,
  IMMINENT_LIVE_START_EVENT,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
  type StreamStateSyncPayload,
} from "@/lib/live/types";

const FinalCountdownExperience = ImminentLiveOverlay;

const LIVE_ACCESS_POLL_MS = 5_000;
const MANIFEST_RETRY_MS = 5_000;
const MANIFEST_SYNC_LISTENER_ID = "live-manifest-stream-sync";

function isStreamStateSyncPayload(value: unknown): value is StreamStateSyncPayload {
  return Boolean(value && typeof value === "object");
}

function shouldActivateDropCurtain(
  dropStartedAt: string | null | undefined,
  durationSeconds: number,
): dropStartedAt is string {
  if (!dropStartedAt?.trim()) return false;
  return resolveImminentLiveRemainingSeconds(dropStartedAt, durationSeconds) > 0;
}

type LiveExperienceClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

type ManifestState =
  | { status: "idle"; playbackUrl: null; message: string }
  | { status: "loading"; playbackUrl: null; message: string }
  | { status: "ready"; playbackUrl: string; message: string }
  | { status: "waiting"; playbackUrl: null; message: string }
  | { status: "error"; playbackUrl: null; message: string };

type ManifestResponse = {
  success?: boolean;
  playbackUrl?: string;
  activeSource?: "primary" | "backup";
  fallback?: boolean;
  fallbackReason?: string;
  error?: string;
};

function PreShowHubExperience({
  concertTitle,
  headlinerName,
}: {
  concertTitle: string;
  headlinerName: string;
}) {
  return (
    <div className="flex h-full min-h-[calc(100dvh-9rem)] items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <p className="font-ui text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-blue">
          Pre-show gathering
        </p>
        <h2 className="mt-4 font-headline text-4xl uppercase tracking-[0.08em] text-white">
          {concertTitle}
        </h2>
        <p className="mt-3 font-body text-base text-white/70">{headlinerName}</p>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-5">
          <p className="font-body text-sm text-white/75">
            Public pre-show is queued. Please stay here while the countdown runs.
          </p>
        </div>
      </div>
    </div>
  );
}

function resolveManifestMessage(response: ManifestResponse): ManifestState {
  const playbackUrl = response.playbackUrl?.trim() ?? "";

  if (!response.success || !playbackUrl) {
    return {
      status: "waiting",
      playbackUrl: null,
      message: response.error ?? "Waiting for the live playback URL.",
    };
  }

  const routeLabel =
    response.activeSource === "backup" ? "Backup feed connected." : "Live stream connected.";

  return {
    status: "ready",
    playbackUrl,
    message: routeLabel,
  };
}

function shouldPollLiveManifest(access: LiveAccessEvaluation | null): boolean {
  if (!access?.canViewStream) return false;
  if (access.streamIsLive || access.devPlaybackOverride) return true;
  return false;
}

export default function LiveExperienceClient({
  initialProfile,
}: LiveExperienceClientProps) {
  const attendeeName = initialProfile.headerDisplayName || initialProfile.email || "Guest";
  const videoRef = useRef<HTMLVideoElement>(null);
  const directVideoRef = useRef<HTMLVideoElement>(null);
  const hlsCleanupRef = useRef<(() => void) | null>(null);
  const directPeerRef = useRef<RTCPeerConnection | null>(null);
  const directChannelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null);
  const directBrowserChannelRef = useRef<BroadcastChannel | null>(null);
  const viewerIdRef = useRef(createDirectCameraClientId("viewer"));
  const directAudioUnlockedRef = useRef(false);
  const handleDirectSignalRef = useRef<(payload: DirectCameraSignal) => Promise<void>>(async () => {});
  const requestDirectOfferRef = useRef<() => void>(() => {});
  const signalingIntervalRef = useRef<number | null>(null);
  const isSignalingRef = useRef(false);
  const handshakeCompleteRef = useRef(false);
  const offerInFlightRef = useRef(false);
  const directStatusRef = useRef<"idle" | "connecting" | "ready">("idle");
  const componentIsUnmountingRef = useRef(false);
  const accessSyncInFlightRef = useRef(false);
  const manifestInFlightRef = useRef(false);
  const streamPlaybackLatchedRef = useRef(false);
  const loadManifestRef = useRef<() => Promise<void>>(async () => {});
  const syncAccessRef = useRef<() => Promise<void>>(async () => {});
  const showImminentOverlayRef = useRef(false);
  const handleImminentLiveStartRef = useRef<(dropStartedAt: string, durationSeconds: number) => void>(
    () => {},
  );
  const [access, setAccess] = useState<LiveAccessEvaluation | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ManifestState>({
    status: "idle",
    playbackUrl: null,
    message: "Checking live broadcast.",
  });
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [directAudioUnlocked, setDirectAudioUnlocked] = useState(false);
  const [directStatus, setDirectStatus] = useState<"idle" | "connecting" | "ready">("idle");
  const [directMessage, setDirectMessage] = useState("Waiting for direct camera publisher.");
  const [showImminentOverlay, setShowImminentOverlay] = useState(false);
  const [showWhiteFlash, setShowWhiteFlash] = useState(false);
  const [dropStartedAt, setDropStartedAt] = useState<string | null>(null);
  const [imminentLiveDurationSec, setImminentLiveDurationSec] = useState(IMMINENT_LIVE_DURATION_SEC);

  const useDirectCamera =
    access?.publishMode === "browser_camera" &&
    access.streamIsLive &&
    Boolean(access.publisherChannel?.trim());
  const directLiveChannel = access?.publisherChannel?.trim() ?? "";
  const directBrowserChannel = directLiveChannel
    ? resolvePublisherBrowserChannel(directLiveChannel)
    : "";

  useEffect(() => {
    showImminentOverlayRef.current = showImminentOverlay;
  }, [showImminentOverlay]);

  useEffect(() => {
    directAudioUnlockedRef.current = directAudioUnlocked;
  }, [directAudioUnlocked]);

  useEffect(() => {
    directStatusRef.current = directStatus;
  }, [directStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seeds") !== "success") return;

    requestLiveSeedWalletRefresh();

    const url = new URL(window.location.href);
    url.pathname = EXPERIENCE_LIVE_PATH;
    url.searchParams.delete("seeds");
    const query = url.searchParams.toString();
    window.history.replaceState({}, "", query ? `${url.pathname}?${query}` : url.pathname);
  }, []);

  useEffect(() => {
    return () => {
      componentIsUnmountingRef.current = true;
    };
  }, []);

  const sendDirectSignal = useCallback((payload: DirectCameraSignal) => {
    sendDirectCameraSignal(directChannelRef.current, payload);
    directBrowserChannelRef.current?.postMessage(payload);
  }, []);

  const clearViewerSignalingInterval = useCallback(() => {
    if (signalingIntervalRef.current !== null) {
      window.clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = null;
    }
  }, []);

  const closeDirectPeer = useCallback(() => {
    handshakeCompleteRef.current = false;
    offerInFlightRef.current = false;
    directPeerRef.current?.close();
    directPeerRef.current = null;
    if (directVideoRef.current) {
      directVideoRef.current.srcObject = null;
    }
    setDirectStatus("idle");
    setDirectMessage("Waiting for direct camera publisher.");
  }, []);

  const requestDirectOffer = useCallback(() => {
    if (isSignalingRef.current || directStatusRef.current === "ready") return;

    isSignalingRef.current = true;
    try {
      if (directStatusRef.current !== "connecting") {
        setDirectStatus("connecting");
        setDirectMessage("Looking for a direct camera publisher...");
      }
      sendDirectSignal({ type: "viewer-ready", viewerId: viewerIdRef.current });
      tryFlushDirectCameraChannelSignals(directChannelRef.current);
    } finally {
      isSignalingRef.current = false;
    }
  }, [sendDirectSignal]);

  const handleDirectSignal = useCallback(
    async (payload: DirectCameraSignal) => {
      if (payload.type === "publisher-online") {
        requestDirectOffer();
        return;
      }

      if (payload.type === "publisher-offline") {
        closeDirectPeer();
        return;
      }

      if (payload.type === "offer" && payload.viewerId === viewerIdRef.current) {
        const existingPeer = directPeerRef.current;

        if (
          handshakeCompleteRef.current ||
          directStatusRef.current === "ready" ||
          (existingPeer?.signalingState === "stable" && existingPeer.connectionState === "connected")
        ) {
          console.log(
            "[WebRTC] Connection is already stable. Skipping duplicate remote description.",
          );
          return;
        }

        if (offerInFlightRef.current) {
          console.warn("[WebRTC] Offer handshake already in progress. Skipping duplicate offer.");
          return;
        }

        if (
          existingPeer &&
          existingPeer.signalingState !== "stable" &&
          existingPeer.signalingState !== "closed"
        ) {
          console.warn(
            `[WebRTC] Unexpected signaling state: ${existingPeer.signalingState}. Skipping overlapping offer.`,
          );
          return;
        }

        existingPeer?.close();
        const peer = createDirectCameraPeer();
        directPeerRef.current = peer;
        offerInFlightRef.current = true;
        handshakeCompleteRef.current = false;

        peer.ontrack = (event) => {
          const [stream] = event.streams;
          if (!stream || !directVideoRef.current) return;
          directVideoRef.current.srcObject = stream;
          directVideoRef.current.muted = !directAudioUnlockedRef.current;
          void directVideoRef.current.play().catch(() => undefined);
          setDirectStatus("ready");
          setDirectMessage("Direct camera live.");
        };
        peer.onicecandidate = (event) => {
          if (!event.candidate) return;
          sendDirectSignal({
            type: "ice",
            targetId: payload.publisherId,
            senderId: viewerIdRef.current,
            candidate: event.candidate.toJSON(),
          });
        };
        peer.onconnectionstatechange = () => {
          if (["closed", "disconnected", "failed"].includes(peer.connectionState)) {
            closeDirectPeer();
          }
        };

        if (peer.signalingState !== "stable") {
          console.warn(`[WebRTC] Unexpected signaling state: ${peer.signalingState}`);
          offerInFlightRef.current = false;
          return;
        }

        try {
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          console.log(
            `[WebRTC] Remote offer applied. Signaling state: ${peer.signalingState}`,
          );

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          console.log(
            `[WebRTC] Local answer applied. Signaling state: ${peer.signalingState}`,
          );

          sendDirectSignal({
            type: "answer",
            viewerId: viewerIdRef.current,
            publisherId: payload.publisherId,
            sdp: answer,
          });

          if (peer.signalingState === "stable") {
            console.log("[WebRTC] Handshake complete: have-remote-offer → stable");
            handshakeCompleteRef.current = true;
            clearViewerSignalingInterval();
          }
        } catch (error) {
          console.error("[WebRTC] Failed to set remote description:", error);
          closeDirectPeer();
        } finally {
          offerInFlightRef.current = false;
        }
        return;
      }

      if (payload.type === "answer" && payload.viewerId === viewerIdRef.current) {
        const pc = directPeerRef.current;
        if (!pc || pc.signalingState === "stable") {
          console.log(
            "[WebRTC] Connection is already stable. Skipping duplicate remote description.",
          );
          return;
        }
        if (pc.signalingState !== "have-local-offer") {
          console.warn(`[WebRTC] Unexpected signaling state: ${pc.signalingState}`);
          return;
        }
        return;
      }

      if (payload.type === "ice" && payload.targetId === viewerIdRef.current) {
        const pc = directPeerRef.current;
        if (!pc || pc.signalingState === "closed") return;
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (error) {
          console.warn("[WebRTC] Failed to add ICE candidate:", error);
        }
      }
    },
    [clearViewerSignalingInterval, closeDirectPeer, requestDirectOffer, sendDirectSignal],
  );

  useEffect(() => {
    handleDirectSignalRef.current = handleDirectSignal;
  }, [handleDirectSignal]);

  useEffect(() => {
    requestDirectOfferRef.current = requestDirectOffer;
  }, [requestDirectOffer]);

  useEffect(() => {
    if (!useDirectCamera || !directLiveChannel) return;

    const supabase = getSupabase();
    const channel = supabase.channel(directLiveChannel, {
      config: { broadcast: { self: false } },
    });
    directChannelRef.current = channel;

    channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      void handleDirectSignalRef.current(payload as DirectCameraSignal);
    });
    channel.subscribe((subscribeStatus) => {
      if (subscribeStatus === "SUBSCRIBED") {
        markDirectCameraChannelJoined(channel);
        requestDirectOfferRef.current();
      }
    });

    if ("BroadcastChannel" in window && directBrowserChannel) {
      const browserChannel = new BroadcastChannel(directBrowserChannel);
      browserChannel.onmessage = (event: MessageEvent<DirectCameraSignal>) => {
        void handleDirectSignalRef.current(event.data);
      };
      directBrowserChannelRef.current = browserChannel;
    }

    if (signalingIntervalRef.current === null) {
      signalingIntervalRef.current = window.setInterval(() => {
        if (directStatusRef.current === "ready") return;
        requestDirectOfferRef.current();
      }, 5_000);
    }

    return () => {
      if (signalingIntervalRef.current !== null) {
        window.clearInterval(signalingIntervalRef.current);
        signalingIntervalRef.current = null;
      }
      clearDirectCameraChannelSignals(channel);
      closeDirectPeer();
      void supabase.removeChannel(channel);
      if (directChannelRef.current === channel) directChannelRef.current = null;
      directBrowserChannelRef.current?.close();
      directBrowserChannelRef.current = null;
    };
  }, [closeDirectPeer, directBrowserChannel, directLiveChannel, useDirectCamera]);

  const syncAccess = useCallback(async () => {
    if (accessSyncInFlightRef.current) return;
    accessSyncInFlightRef.current = true;
    try {
      const evaluation = await fetchLiveAccessEvaluation();
      if (componentIsUnmountingRef.current) return;
      setAccess(evaluation);
      setAccessError(null);
    } catch {
      if (componentIsUnmountingRef.current) return;
      setAccessError("Unable to check live access. Retrying...");
    } finally {
      accessSyncInFlightRef.current = false;
    }
  }, []);

  syncAccessRef.current = syncAccess;

  useEffect(() => {
    queueMicrotask(() => void syncAccess());
    const intervalId = window.setInterval(() => void syncAccess(), LIVE_ACCESS_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [syncAccess]);

  const loadManifest = useCallback(async () => {
    if (manifestInFlightRef.current) return;
    manifestInFlightRef.current = true;

    setManifest((prev) =>
      prev.status === "ready" || prev.status === "loading"
        ? prev
        : {
            status: "loading",
            playbackUrl: null,
            message: "Looking for the live playback URL.",
          },
    );

    try {
      const response = await fetch("/api/stream/manifest?experience=main_stage", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (componentIsUnmountingRef.current) return;

      if (!response.ok) {
        setManifest({
          status: response.status === 404 ? "waiting" : "error",
          playbackUrl: null,
          message:
            response.status === 404
              ? "The broadcast is not live yet."
              : `Live playback is unavailable (${response.status}).`,
        });
        return;
      }

      const data = (await response.json()) as ManifestResponse;
      if (componentIsUnmountingRef.current) return;
      const nextManifest = resolveManifestMessage(data);
      setManifest((prev) => {
        if (
          prev.status === "ready" &&
          prev.playbackUrl &&
          nextManifest.status === "ready" &&
          nextManifest.playbackUrl
        ) {
          return {
            ...nextManifest,
            playbackUrl: prev.playbackUrl,
          };
        }
        if (nextManifest.status === "ready" && nextManifest.playbackUrl) {
          streamPlaybackLatchedRef.current = true;
        }
        return nextManifest;
      });
    } catch {
      if (componentIsUnmountingRef.current) return;
      setManifest({
        status: "error",
        playbackUrl: null,
        message: "Could not load the live playback URL.",
      });
    } finally {
      manifestInFlightRef.current = false;
    }
  }, []);

  loadManifestRef.current = loadManifest;

  const handleImminentLiveStart = useCallback((startedAt: string, durationSeconds: number) => {
    streamPlaybackLatchedRef.current = false;
    setDropStartedAt(startedAt);
    setImminentLiveDurationSec(durationSeconds);
    setShowImminentOverlay(true);
  }, []);

  useEffect(() => {
    handleImminentLiveStartRef.current = handleImminentLiveStart;
  }, [handleImminentLiveStart]);

  useEffect(() => {
    if (!access || useDirectCamera) return;

    if (
      access.broadcastCurrentState === "imminent_live" &&
      shouldActivateDropCurtain(access.imminentLiveStartedAt, access.imminentLiveDurationSeconds)
    ) {
      handleImminentLiveStart(access.imminentLiveStartedAt!, access.imminentLiveDurationSeconds);
    }
  }, [
    access,
    access?.broadcastCurrentState,
    access?.imminentLiveDurationSeconds,
    access?.imminentLiveStartedAt,
    handleImminentLiveStart,
    useDirectCamera,
  ]);

  const handleImminentOverlayComplete = useCallback(() => {
    setShowImminentOverlay(false);
    setDropStartedAt(null);
    setShowWhiteFlash(true);
    window.setTimeout(() => setShowWhiteFlash(false), 180);
    void syncAccess();
    void loadManifest();
  }, [loadManifest, syncAccess]);

  useEffect(() => {
    if (useDirectCamera) return;

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return;
    }

    const handleStreamStateSyncPayload = (payload: unknown) => {
      if (cancelled) return;

      const syncPayload = isStreamStateSyncPayload(payload) ? payload : null;
      if (
        syncPayload?.event === IMMINENT_LIVE_START_EVENT &&
        syncPayload.dropStartedAt?.trim()
      ) {
        handleImminentLiveStartRef.current(
          syncPayload.dropStartedAt,
          syncPayload.durationSeconds ?? IMMINENT_LIVE_DURATION_SEC,
        );
        return;
      }

      if (showImminentOverlayRef.current) return;

      void syncAccessRef.current();
      void loadManifestRef.current();
    };

    acquirePlatformChannel(supabase);

    registerPlatformListener(MANIFEST_SYNC_LISTENER_ID, (channel) =>
      channel.on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, ({ payload }) => {
        handleStreamStateSyncPayload(payload);
      }),
    );

    commitPlatformChannelSubscribe();

    const wakeStreamStateSync = () => {
      if (cancelled) return;
      if (!isPlatformChannelSubscribed()) {
        resubscribePlatformChannel();
      }
      void syncAccessRef.current();
      if (!showImminentOverlayRef.current) {
        void loadManifestRef.current();
      }
    };

    const unsubscribeChannelStatus = subscribePlatformChannelStatus((status) => {
      if (cancelled) return;
      if (STALE_REALTIME_SUBSCRIBE_STATUSES.has(status)) {
        resubscribePlatformChannel();
      }
    });

    const handleWindowFocus = () => {
      wakeStreamStateSync();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleWindowFocus);
      unsubscribeChannelStatus();
      unregisterPlatformListener(MANIFEST_SYNC_LISTENER_ID);
      releasePlatformChannel(supabase);
    };
  }, [useDirectCamera]);

  useEffect(() => {
    if (useDirectCamera) {
      queueMicrotask(() => {
        setManifest({
          status: "idle",
          playbackUrl: null,
          message: "Connecting to owner camera feed.",
        });
      });
      return;
    }

    if (showImminentOverlay) return;

    const mayPollManifest =
      shouldPollLiveManifest(access) || streamPlaybackLatchedRef.current;

    if (!mayPollManifest) {
      queueMicrotask(() => {
        streamPlaybackLatchedRef.current = false;
        setManifest({
          status: "idle",
          playbackUrl: null,
          message: "Waiting for the broadcast to begin.",
        });
      });
      return;
    }

    queueMicrotask(() => void loadManifest());
    const intervalId = window.setInterval(() => void loadManifest(), MANIFEST_RETRY_MS);
    return () => window.clearInterval(intervalId);
  }, [access?.canViewStream, access?.streamIsLive, loadManifest, showImminentOverlay, useDirectCamera]);

  const streamUrl = manifest.playbackUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) {
      hlsCleanupRef.current?.();
      hlsCleanupRef.current = null;
      if (video) {
        video.removeAttribute("src");
        video.load();
      }
      return;
    }

    let cancelled = false;

    void attachHlsPlayback(video, streamUrl, {
      onFatalError: (details) => {
        if (cancelled) return;
        streamPlaybackLatchedRef.current = false;
        setManifest({
          status: "error",
          playbackUrl: null,
          message: `Live playback failed: ${details}.`,
        });
      },
    })
      .then((cleanup) => {
        if (cancelled) {
          cleanup();
          return;
        }
        hlsCleanupRef.current?.();
        hlsCleanupRef.current = cleanup;
      })
      .catch(() => {
        if (cancelled) return;
        setManifest({
          status: "error",
          playbackUrl: null,
          message: "Live playback failed: could not load the HLS player.",
        });
      });

    return () => {
      cancelled = true;
      hlsCleanupRef.current?.();
      hlsCleanupRef.current = null;
    };
  }, [streamUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !audioUnlocked;
  }, [audioUnlocked, streamUrl]);

  const enableAudio = useCallback(() => {
    const video = videoRef.current;
    setAudioUnlocked(true);
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => undefined);
  }, []);

  const enableDirectAudio = useCallback(() => {
    const video = directVideoRef.current;
    setDirectAudioUnlocked(true);
    if (!video) return;
    video.muted = false;
    void video.play().catch(() => undefined);
  }, []);

  const locked = access && !access.authenticated;
  const waitingForAccess = !access && !accessError;
  const isPreShowHolding =
    Boolean(access) &&
    !access.streamIsLive &&
    access.broadcastCurrentState === "scheduled" &&
    (access.gatesLocked || access.preShowVipOnly);
  const showPreShowHub = isPreShowHolding && !locked && !showImminentOverlay;
  const showPlayer =
    Boolean(manifest.playbackUrl) && !useDirectCamera && !showImminentOverlay && !showPreShowHub;
  const showDirectPlayer = useDirectCamera && directStatus === "ready";

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-blue">
              300 Awakening
            </p>
            <h1 className="font-headline text-xl uppercase tracking-[0.08em] sm:text-2xl">
              Live
            </h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/70">
            {showImminentOverlay
              ? "Initializing"
              : showDirectPlayer
                ? "Direct Live"
                : access?.streamIsLive
                  ? "On Air"
                  : "Standby"}
          </div>
        </header>

        <section className="relative min-h-0 flex-1 overflow-hidden bg-[#050505]">
          {showPreShowHub ? (
            <PreShowHubExperience
              concertTitle={access?.concertTitle ?? "The Awakening Experience"}
              headlinerName={access?.headlinerName ?? "Pastor David Jenkins"}
            />
          ) : showDirectPlayer ? (
            <>
              <video
                ref={directVideoRef}
                className="absolute inset-0 h-full w-full bg-black object-contain"
                controls
                playsInline
                autoPlay
                muted={!directAudioUnlocked}
              />
              {!directAudioUnlocked ? (
                <button
                  type="button"
                  onClick={enableDirectAudio}
                  className="absolute bottom-5 left-1/2 z-10 min-h-11 -translate-x-1/2 rounded-full border border-brand-blue/50 bg-black/75 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-blue backdrop-blur"
                >
                  Tap for audio
                </button>
              ) : null}
            </>
          ) : showPlayer ? (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full bg-black object-contain"
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                playsInline
                preload="none"
                autoPlay
                muted={!audioUnlocked}
                crossOrigin="anonymous"
              />
              {!audioUnlocked ? (
                <button
                  type="button"
                  onClick={enableAudio}
                  className="absolute bottom-5 left-1/2 z-10 min-h-11 -translate-x-1/2 rounded-full border border-brand-blue/50 bg-black/75 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-blue backdrop-blur"
                >
                  Tap for audio
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex h-full min-h-[calc(100dvh-9rem)] items-center justify-center px-6 text-center">
              <div className="max-w-lg">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/10">
                  <span className="h-3 w-3 rounded-full bg-brand-blue shadow-[0_0_24px_rgba(83,252,255,0.75)]" />
                </div>
                <p className="font-ui text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/60">
                  {waitingForAccess ? "Checking access" : locked ? "Sign in required" : "Waiting for signal"}
                </p>
                <p className="mt-4 font-body text-base text-white/80">
                  {directStatus === "connecting" ? directMessage : accessError ?? manifest.message}
                </p>
                <p className="mt-3 font-body text-xs text-white/45">
                  For direct camera testing, open <span className="text-white/70">/live?publish=1</span> in
                  another tab or on the camera device.
                </p>
                {locked ? (
                  <Link
                    href={buildAttendeeGateUrl(EXPERIENCE_LIVE_PATH)}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue/50 bg-brand-blue/10 px-6 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-blue"
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <footer className="flex items-center justify-between border-t border-white/10 bg-black px-4 py-3 font-body text-xs text-white/55 sm:px-6">
          <span>{attendeeName}</span>
          <span>{showDirectPlayer ? "Direct camera connected" : manifest.status === "ready" ? "Connected" : manifest.status}</span>
        </footer>
      </div>

      {showWhiteFlash ? (
        <div className="fixed inset-0 z-[220] bg-white" aria-hidden="true" />
      ) : null}

      {showImminentOverlay && dropStartedAt ? (
        <FinalCountdownExperience
          dropStartedAt={dropStartedAt}
          durationSeconds={imminentLiveDurationSec}
          onCountdownComplete={handleImminentOverlayComplete}
        />
      ) : null}
    </main>
  );
}
