"use client";


import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import CustomEmojiAnimator from "@/components/experience/live/CustomEmojiAnimator";
import LiveStreamChat, {
  type LiveStreamChatHandle,
} from "@/components/experience/live/LiveStreamChat";
import LiveMobileDock from "@/components/experience/live/LiveMobileDock";
import LiveExperienceHeader from "@/components/experience/live/LiveExperienceHeader";
import LiveFeatureErrorBoundary from "@/components/experience/live/LiveFeatureErrorBoundary";
import LiveReactionTray from "@/components/experience/live/LiveReactionTray";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { useIanCraigLiveSeedActions } from "@/lib/experience/useIanCraigLiveSeedActions";
import { useLiveChatSimulation } from "@/lib/live/use-live-chat-simulation";
import { useLiveViewerCount } from "@/lib/experience/useLiveViewerCount";
import { fetchLiveAccessEvaluation, type LiveAccessEvaluation } from "@/lib/access";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { ManifestCarrier } from "@/lib/live/resolve-manifest-playback";
import {
  attachAutoLevelingMatrix,
  type AutoLevelingMatrix,
} from "@/lib/live/audio-auto-leveling";
import { requestLiveSeedWalletRefresh } from "@/lib/live/seed-wallet-events";
import { isDemoManifestPlaybackUrl } from "@/lib/live/manifest-dev-fallback";
import { getSupabase } from "@/lib/supabase/client";
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
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import { LIVE_ROOM_PLATFORM_CHANNEL, LIVE_STREAM_STATE_BROADCAST_EVENT } from "@/lib/live/types";
import {
  getLiveReactionDefinition,
  parseEmojiBurstPayload,
} from "@/lib/live/live-reactions";

const LIVE_ACCESS_POLL_MS = 5_000;
const MANIFEST_RETRY_FAST_MS = 2_500;
const MANIFEST_RETRY_STEADY_MS = 5_000;
const MANIFEST_SYNC_LISTENER_ID = "live-manifest-stream-sync";
const EMOJI_BURST_LISTENER_ID = "live-emoji-burst-sync";
const HLS_MAX_RECOVERY_ATTEMPTS = 3;
const HLS_RECOVERY_BASE_MS = 1_500;
const EMOJI_BURST_EVENT = "emoji_burst";
const GLOBAL_OFFERING_ALERT_EVENT = "global_offering_alert";
const QUICK_SOW_COST = 100;

type FloatingEmojiBurst = {
  id: string;
  assetId: string;
};

type LedgerEntry = {
  id: string;
  label: string;
  detail: string;
  at: number;
};

type SeedDeductionType = "offering_sow";

type SeedDeductionResponse = {
  success?: boolean;
  newBalance?: number;
  message?: string;
};

type LivePlatformBroadcastEvent =
  | typeof EMOJI_BURST_EVENT
  | typeof GLOBAL_OFFERING_ALERT_EVENT;

type LiveExperienceClientProps = {
  initialProfile: AttendeeProfileSnapshot;
  countdownConfig: EventCountdownConfig;
  initialCountdown: CountdownParts;
};

type ManifestState =
  | { status: "idle"; playbackUrl: null; message: string; carrier: null; activeSource: null }
  | { status: "loading"; playbackUrl: null; message: string; carrier: null; activeSource: null }
  | {
      status: "ready";
      playbackUrl: string;
      message: string;
      carrier: ManifestCarrier;
      activeSource: "primary" | "backup";
    }
  | { status: "waiting"; playbackUrl: null; message: string; carrier: null; activeSource: null }
  | { status: "error"; playbackUrl: null; message: string; carrier: null; activeSource: null };

type ManifestResponse = {
  success?: boolean;
  playbackUrl?: string;
  activeSource?: "primary" | "backup";
  carrier?: ManifestCarrier;
  fallback?: boolean;
  fallbackReason?: string;
  error?: string;
};

function resolveManifestCarrier(_response: ManifestResponse): ManifestCarrier {
  return "restream";
}

function resolveManifestActiveSource(response: ManifestResponse): "primary" | "backup" {
  return response.activeSource === "backup" ? "backup" : "primary";
}

function resolveManifestMessage(response: ManifestResponse): ManifestState {
  const playbackUrl = response.playbackUrl?.trim() ?? "";

  if (!response.success || !playbackUrl) {
    return {
      status: "waiting",
      playbackUrl: null,
      message: response.error ?? "Waiting for the live playback URL.",
      carrier: null,
      activeSource: null,
    };
  }

  const carrier = resolveManifestCarrier(response);
  const activeSource = resolveManifestActiveSource(response);
  const isDevStream = response.fallback === true || isDemoManifestPlaybackUrl(playbackUrl);

  return {
    status: "ready",
    playbackUrl,
    message: isDevStream ? "Playing development test stream." : "Live stream connected.",
    carrier,
    activeSource,
  };
}

/** Manifest poll surface — loading until playback URL resolves. */
function useLiveManifestPoller(manifest: ManifestState) {
  return {
    isLoading: manifest.status === "loading" || manifest.status === "idle",
    playbackUrl: manifest.playbackUrl,
  };
}

function HlsVideoPlayer({
  url,
  videoRef,
  audioUnlocked,
}: {
  url: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioUnlocked: boolean;
}) {
  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full bg-black object-cover lg:object-contain"
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      playsInline
      preload="none"
      autoPlay
      muted={!audioUnlocked}
      crossOrigin="anonymous"
      data-playback-url={url}
    />
  );
}

export default function LiveExperienceClient({
  initialProfile,
  countdownConfig,
  initialCountdown,
}: LiveExperienceClientProps) {
  const attendeeName = initialProfile.headerDisplayName || initialProfile.email || "Guest";
  const videoRef = useRef<HTMLVideoElement>(null);
  const directVideoRef = useRef<HTMLVideoElement>(null);
  const liveChatRef = useRef<LiveStreamChatHandle>(null);
  const hlsCleanupRef = useRef<(() => void) | null>(null);
  const hlsInstanceRef = useRef<import("hls.js").default | null>(null);
  const hlsRetryCountRef = useRef(0);
  const hlsRecoveryTimerRef = useRef<number | null>(null);
  const attachHlsEngineRef = useRef<
    (video: HTMLVideoElement, streamUrl: string, cancelled: () => boolean) => Promise<void>
  >(async () => {});
  const manifestHasUrlRef = useRef(false);
  const manifestPollingTimerRef = useRef<number | null>(null);
  const manifestPollingWatchRef = useRef<number | null>(null);
  const activePlaybackUrlRef = useRef<string | null>(null);
  const autoLevelingMatrixRef = useRef<AutoLevelingMatrix | null>(null);
  const audioUnlockedRef = useRef(false);
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
  const loadManifestRef = useRef<() => Promise<void>>(async () => {});
  const syncAccessRef = useRef<() => Promise<void>>(async () => {});
  const [access, setAccess] = useState<LiveAccessEvaluation | null>(null);
  const [, setAccessError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ManifestState>({
    status: "idle",
    playbackUrl: null,
    message: "Checking live broadcast.",
    carrier: null,
    activeSource: null,
  });
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [autoLevelingActive, setAutoLevelingActive] = useState(false);
  const [directAudioUnlocked, setDirectAudioUnlocked] = useState(false);
  const [directStatus, setDirectStatus] = useState<"idle" | "connecting" | "ready">("idle");
  const [, setDirectMessage] = useState("Waiting for direct camera publisher.");
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiBurst[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isPlaybackBuffering, setIsPlaybackBuffering] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const { playbackUrl } = useLiveManifestPoller(manifest);
  const {
    balance: walletSeedBalance,
    isLoading: seedBalanceLoading,
    handleAddSeeds,
  } = useIanCraigLiveSeedActions();
  const [optimisticSeedBalance, setSeedBalance] = useState<number | null>(null);
  const [isDeductingSeeds, setIsDeductingSeeds] = useState(false);
  const seedBalance = optimisticSeedBalance ?? walletSeedBalance;

  const { displayLabel: viewerCountLabel } = useLiveViewerCount({
    enabled: true,
    userId: initialProfile.userId ?? null,
  });
  const { messages: simulatedChatMessages } = useLiveChatSimulation({ enabled: true });

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const syncMobileOffsets = () => {
      const dock = root.querySelector(".live-sanctuary-mobile-dock");
      const composer = root.querySelector(".live-sanctuary-mobile-composer");

      const dockHeight =
        dock instanceof HTMLElement ? Math.ceil(dock.getBoundingClientRect().height) : 0;
      const composerHeight =
        composer instanceof HTMLElement ? Math.ceil(composer.getBoundingClientRect().height) : 0;

      root.style.setProperty("--live-mobile-dock-h", `${dockHeight}px`);
      root.style.setProperty("--live-mobile-composer-h", `${composerHeight}px`);
    };

    syncMobileOffsets();

    const observer = new ResizeObserver(syncMobileOffsets);
    observer.observe(root);
    const dock = root.querySelector(".live-sanctuary-mobile-dock");
    const composer = root.querySelector(".live-sanctuary-mobile-composer");
    if (dock instanceof HTMLElement) observer.observe(dock);
    if (composer instanceof HTMLElement) observer.observe(composer);

    return () => observer.disconnect();
  }, [mobileChatOpen]);

  const useDirectCamera =
    access?.publishMode === "browser_camera" &&
    access.streamIsLive &&
    Boolean(access.publisherChannel?.trim());
  const directLiveChannel = access?.publisherChannel?.trim() ?? "";
  const directBrowserChannel = directLiveChannel
    ? resolvePublisherBrowserChannel(directLiveChannel)
    : "";

  useEffect(() => {
    directAudioUnlockedRef.current = directAudioUnlocked;
  }, [directAudioUnlocked]);

  useEffect(() => {
    audioUnlockedRef.current = audioUnlocked;
  }, [audioUnlocked]);

  useEffect(() => {
    const matrix = autoLevelingMatrixRef.current;
    if (!matrix) return;
    if (audioUnlocked) {
      void matrix.resume();
    } else {
      void matrix.suspend();
    }
  }, [audioUnlocked]);

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

  useEffect(() => {
    syncAccessRef.current = syncAccess;
  }, [syncAccess]);

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
            carrier: null,
            activeSource: null,
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
        setManifest((prev) => {
          if (prev.status === "ready" && prev.playbackUrl) {
            return prev;
          }
          return {
            status: response.status === 404 ? "waiting" : "error",
            playbackUrl: null,
            message:
              response.status === 404
                ? "The broadcast is not live yet."
                : `Live playback is unavailable (${response.status}).`,
            carrier: null,
            activeSource: null,
          };
        });
        return;
      }

      const data = (await response.json()) as ManifestResponse;
      if (componentIsUnmountingRef.current) return;
      const nextManifest = resolveManifestMessage(data);
      setManifest(nextManifest);
      if (nextManifest.status === "ready" && nextManifest.playbackUrl) {
        manifestHasUrlRef.current = true;
        setIsPlaybackBuffering(true);
      }
    } catch {
      if (componentIsUnmountingRef.current) return;
      setManifest((prev) => {
        if (prev.status === "ready" && prev.playbackUrl) {
          return prev;
        }
        return {
          status: "error",
          playbackUrl: null,
          message: "Could not load the live playback URL.",
          carrier: null,
          activeSource: null,
        };
      });
    } finally {
      manifestInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadManifestRef.current = loadManifest;
  }, [loadManifest]);

  const clearManifestStreamTracking = useCallback(() => {
    if (manifestPollingTimerRef.current !== null) {
      window.clearInterval(manifestPollingTimerRef.current);
      manifestPollingTimerRef.current = null;
    }
    if (manifestPollingWatchRef.current !== null) {
      window.clearInterval(manifestPollingWatchRef.current);
      manifestPollingWatchRef.current = null;
    }
    manifestHasUrlRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch {
      return;
    }

    acquirePlatformChannel(supabase);

    registerPlatformListener(MANIFEST_SYNC_LISTENER_ID, (channel) => {
      if (useDirectCamera) return channel;

      return channel.on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
        if (cancelled) return;
        void syncAccessRef.current();
        void loadManifestRef.current();
      });
    });

    registerPlatformListener(EMOJI_BURST_LISTENER_ID, (channel) =>
      channel.on("broadcast", { event: EMOJI_BURST_EVENT }, ({ payload }) => {
        if (cancelled) return;

        const { assetId, userId } = parseEmojiBurstPayload(payload);

        if (userId && userId === initialProfile.userId) {
          return;
        }

        const reaction = getLiveReactionDefinition(assetId);
        const burstId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        setFloatingEmojis((current) => [...current, { id: burstId, assetId: reaction.assetId }]);
        setLedgerEntries((current) =>
          [
            {
              id: burstId,
              label: reaction.ledgerLabel,
              detail: "Emoji burst on stage",
              at: Date.now(),
            },
            ...current,
          ].slice(0, 40),
        );
      }),
    );

    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      unregisterPlatformListener(MANIFEST_SYNC_LISTENER_ID);
      unregisterPlatformListener(EMOJI_BURST_LISTENER_ID);
      releasePlatformChannel(supabase);
    };
  }, [initialProfile.userId, useDirectCamera]);

  useEffect(() => {
    if (useDirectCamera) {
      queueMicrotask(() => {
        clearManifestStreamTracking();
        setManifest({
          status: "idle",
          playbackUrl: null,
          message: "Connecting to owner camera feed.",
          carrier: null,
          activeSource: null,
        });
      });
      return;
    }

    if (!access?.canViewStream || !access.streamIsLive) {
      queueMicrotask(() => {
        clearManifestStreamTracking();
        setManifest({
          status: "idle",
          playbackUrl: null,
          message: "Waiting for the broadcast to begin.",
          carrier: null,
          activeSource: null,
        });
      });
      return;
    }

    queueMicrotask(() => void loadManifest());

    let currentPollMs = MANIFEST_RETRY_FAST_MS;

    const armManifestInterval = () => {
      if (manifestPollingTimerRef.current !== null) {
        window.clearInterval(manifestPollingTimerRef.current);
      }
      currentPollMs = manifestHasUrlRef.current ? MANIFEST_RETRY_STEADY_MS : MANIFEST_RETRY_FAST_MS;
      manifestPollingTimerRef.current = window.setInterval(() => void loadManifest(), currentPollMs);
    };

    armManifestInterval();

    manifestPollingWatchRef.current = window.setInterval(() => {
      const nextPollMs = manifestHasUrlRef.current ? MANIFEST_RETRY_STEADY_MS : MANIFEST_RETRY_FAST_MS;
      if (nextPollMs !== currentPollMs) {
        armManifestInterval();
      }
    }, MANIFEST_RETRY_FAST_MS);

    return () => {
      clearManifestStreamTracking();
    };
  }, [
    access?.canViewStream,
    access?.streamIsLive,
    clearManifestStreamTracking,
    loadManifest,
    useDirectCamera,
  ]);

  const streamUrl = manifest.playbackUrl;

  const clearAutoLevelingMatrix = useCallback(() => {
    autoLevelingMatrixRef.current?.cleanup();
    autoLevelingMatrixRef.current = null;
    setAutoLevelingActive(false);
  }, []);

  const installAutoLevelingMatrix = useCallback((video: HTMLVideoElement) => {
    clearAutoLevelingMatrix();
    const matrix = attachAutoLevelingMatrix(video);
    if (!matrix) return;
    autoLevelingMatrixRef.current = matrix;
    setAutoLevelingActive(true);
    if (audioUnlockedRef.current) {
      void matrix.resume();
    } else {
      void matrix.suspend();
    }
  }, [clearAutoLevelingMatrix]);

  const destroyHlsPlayback = useCallback(() => {
    if (hlsRecoveryTimerRef.current !== null) {
      window.clearTimeout(hlsRecoveryTimerRef.current);
      hlsRecoveryTimerRef.current = null;
    }
    hlsCleanupRef.current?.();
    hlsCleanupRef.current = null;
    hlsInstanceRef.current = null;
    activePlaybackUrlRef.current = null;
  }, []);

  const finalizePlaybackFailure = useCallback((message: string) => {
    hlsRetryCountRef.current = 0;
    setIsPlaybackBuffering(false);
    setIsVideoPlaying(false);
    manifestHasUrlRef.current = false;
    destroyHlsPlayback();
    setManifest({
      status: "error",
      playbackUrl: null,
      message,
      carrier: null,
      activeSource: null,
    });
  }, [destroyHlsPlayback]);

  const scheduleHlsRecovery = useCallback(
    (
      video: HTMLVideoElement,
      streamUrl: string,
      cancelled: () => boolean,
      errorDetail: string,
      recover: () => void,
    ) => {
      if (cancelled() || componentIsUnmountingRef.current) return;

      if (hlsRetryCountRef.current >= HLS_MAX_RECOVERY_ATTEMPTS) {
        finalizePlaybackFailure(
          `Live playback failed after ${HLS_MAX_RECOVERY_ATTEMPTS} recovery attempts: ${errorDetail}.`,
        );
        return;
      }

      hlsRetryCountRef.current += 1;
      const delayMs = HLS_RECOVERY_BASE_MS * 2 ** (hlsRetryCountRef.current - 1);
      setIsPlaybackBuffering(true);
      setIsVideoPlaying(false);

      if (hlsRecoveryTimerRef.current !== null) {
        window.clearTimeout(hlsRecoveryTimerRef.current);
      }

      hlsRecoveryTimerRef.current = window.setTimeout(() => {
        hlsRecoveryTimerRef.current = null;
        if (cancelled() || componentIsUnmountingRef.current) return;

        video.muted = !audioUnlockedRef.current;
        recover();
        void video.play().catch(() => undefined);
      }, delayMs);
    },
    [finalizePlaybackFailure],
  );

  const hotSwapHlsSource = useCallback((nextUrl: string) => {
    const hls = hlsInstanceRef.current;
    const video = videoRef.current;
    if (!hls || !video || activePlaybackUrlRef.current === nextUrl) return false;

    hlsRetryCountRef.current = 0;
    hls.loadSource(nextUrl);
    hls.startLoad();
    activePlaybackUrlRef.current = nextUrl;
    video.muted = !audioUnlockedRef.current;
    setIsPlaybackBuffering(true);
    setIsVideoPlaying(false);
    void video.play().catch(() => undefined);
    return true;
  }, []);

  const attachHlsEngine = useCallback(
    async (video: HTMLVideoElement, streamUrl: string, cancelled: () => boolean) => {
      const HlsModule = (await import("hls.js")).default;

      if (HlsModule.isSupported()) {
        destroyHlsPlayback();

        const hlsConfig = {
          // Sit further back from the live edge and keep a deeper buffer so the
          // player doesn't starve/stall (the "flashing in and out") when the feed
          // has upstream jitter (Restream → IVS → relay). A few extra seconds of
          // latency is an acceptable trade for smooth playback on a service stream.
          liveSyncDuration: 6,
          liveMaxLatencyDuration: 20,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          enableWorker: true,
          lowLatencyMode: false,
        };

        const hls = new HlsModule({
          ...hlsConfig,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          },
        });

        hlsInstanceRef.current = hls;
        activePlaybackUrlRef.current = streamUrl;
        video.muted = !audioUnlockedRef.current;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          if (cancelled()) return;
          installAutoLevelingMatrix(video);
          setIsPlaybackBuffering(true);
          video.muted = !audioUnlockedRef.current;
          void video.play().catch(() => undefined);
        });

        hls.on(HlsModule.Events.ERROR, (_, data) => {
          if (cancelled() || !data.fatal) return;

          const errorDetail = data.details || data.type || "HLS error";
          scheduleHlsRecovery(
            video,
            streamUrl,
            cancelled,
            errorDetail,
            () => {
              if (data.type === HlsModule.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
                return;
              }
              if (data.type === HlsModule.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
                return;
              }
              destroyHlsPlayback();
              void attachHlsEngineRef.current(video, streamUrl, cancelled);
            },
          );
        });

        hlsCleanupRef.current = () => {
          if (hlsRecoveryTimerRef.current !== null) {
            window.clearTimeout(hlsRecoveryTimerRef.current);
            hlsRecoveryTimerRef.current = null;
          }
          hls.destroy();
          hlsInstanceRef.current = null;
          activePlaybackUrlRef.current = null;
        };
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        destroyHlsPlayback();
        activePlaybackUrlRef.current = streamUrl;
        video.muted = !audioUnlockedRef.current;
        video.src = streamUrl;
        video.load();
        installAutoLevelingMatrix(video);
        setIsPlaybackBuffering(true);
        void video.play().catch(() => undefined);
        hlsCleanupRef.current = () => {
          video.removeAttribute("src");
          video.load();
          activePlaybackUrlRef.current = null;
        };
        return;
      }

      finalizePlaybackFailure("This browser cannot play the live HLS stream.");
    },
    [destroyHlsPlayback, finalizePlaybackFailure, installAutoLevelingMatrix, scheduleHlsRecovery],
  );

  useEffect(() => {
    attachHlsEngineRef.current = attachHlsEngine;
  }, [attachHlsEngine]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl || useDirectCamera) return;

    const onPlaying = () => {
      hlsRetryCountRef.current = 0;
      setIsVideoPlaying(true);
      setIsPlaybackBuffering(false);
    };
    const onWaiting = () => {
      setIsVideoPlaying(false);
      setIsPlaybackBuffering(true);
    };
    const onError = () => {
      if (hlsInstanceRef.current) return;
      const code = video.error?.code;
      scheduleHlsRecovery(
        video,
        streamUrl,
        () => componentIsUnmountingRef.current,
        code ? `Video element error ${code}` : "Video element error",
        () => {
          video.muted = !audioUnlockedRef.current;
          video.load();
          void video.play().catch(() => undefined);
        },
      );
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("error", onError);
    };
  }, [scheduleHlsRecovery, streamUrl, useDirectCamera]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !audioUnlocked;
  }, [audioUnlocked]);

  useEffect(() => {
    return () => {
      clearManifestStreamTracking();
      destroyHlsPlayback();
      clearAutoLevelingMatrix();
    };
  }, [clearAutoLevelingMatrix, clearManifestStreamTracking, destroyHlsPlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) {
      manifestHasUrlRef.current = false;
      destroyHlsPlayback();
      clearAutoLevelingMatrix();
      if (video) {
        video.removeAttribute("src");
        video.load();
      }
      return;
    }

    if (
      hlsInstanceRef.current &&
      activePlaybackUrlRef.current &&
      activePlaybackUrlRef.current !== streamUrl
    ) {
      hotSwapHlsSource(streamUrl);
      return;
    }

    if (activePlaybackUrlRef.current === streamUrl && hlsInstanceRef.current) {
      return;
    }

    video.muted = !audioUnlockedRef.current;
    hlsRetryCountRef.current = 0;
    let cancelled = false;

    void attachHlsEngine(video, streamUrl, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [attachHlsEngine, clearAutoLevelingMatrix, destroyHlsPlayback, hotSwapHlsSource, streamUrl]);

  const enableAudio = useCallback(() => {
    const video = videoRef.current;
    setAudioUnlocked(true);
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void autoLevelingMatrixRef.current?.resume();
    void video.play().catch(() => undefined);
  }, []);

  const enableDirectAudio = useCallback(() => {
    const video = directVideoRef.current;
    setDirectAudioUnlocked(true);
    if (!video) return;
    video.muted = false;
    void video.play().catch(() => undefined);
  }, []);

  const dismissFloatingEmoji = useCallback((id: string) => {
    setFloatingEmojis((current) => current.filter((item) => item.id !== id));
  }, []);

  const broadcastLivePlatformEvent = useCallback(
    async (event: LivePlatformBroadcastEvent, payload: Record<string, unknown>) => {
      try {
        const supabase = getSupabase();
        const channel = supabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);

        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const timeoutId = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            void supabase.removeChannel(channel);
            reject(new Error(`Timed out broadcasting ${event}.`));
          }, 5_000);

          const settle = (callback: () => void) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            callback();
          };

          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              settle(() => {
                void channel
                  .send({
                    type: "broadcast",
                    event,
                    payload,
                  })
                  .then(() => resolve())
                  .catch((error) => reject(error))
                  .finally(() => {
                    void supabase.removeChannel(channel);
                  });
              });
              return;
            }

            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
              settle(() => {
                void supabase.removeChannel(channel);
                reject(new Error(`Broadcast channel ended with status ${status}.`));
              });
            }
          });
        });
      } catch (error) {
        console.error("Live platform broadcast failed:", error);
      }
    },
    [],
  );

  const pushLocalEmojiBurst = useCallback((assetId: string, detail: string) => {
    const reaction = getLiveReactionDefinition(assetId);
    const burstId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setFloatingEmojis((current) => [...current, { id: burstId, assetId: reaction.assetId }]);
    setLedgerEntries((current) =>
      [
        {
          id: burstId,
          label: reaction.ledgerLabel,
          detail,
          at: Date.now(),
        },
        ...current,
      ].slice(0, 40),
    );
  }, []);

  const pushOfferingLedgerEntry = useCallback((detail: string) => {
    const entryId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setLedgerEntries((current) =>
      [
        {
          id: entryId,
          label: "Offering Sow",
          detail,
          at: Date.now(),
        },
        ...current,
      ].slice(0, 40),
    );
  }, []);

  const executeSeedDeduction = useCallback(
    async (cost: number, type: SeedDeductionType, detail: string) => {
      if (isDeductingSeeds) return;

      setIsDeductingSeeds(true);

      try {
        const response = await fetch("/api/seeds/deduct", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cost,
            transactionType: type,
            description: detail,
          }),
        });

        const result = (await response.json().catch(() => ({}))) as SeedDeductionResponse;

        if (!response.ok || !result.success) {
          window.alert(result.message || "Transaction failed. Please check your seed balance.");
          return;
        }

        if (typeof result.newBalance === "number") {
          setSeedBalance(result.newBalance);
        }

        if (type === "offering_sow") {
          pushOfferingLedgerEntry(detail);

          if (cost >= QUICK_SOW_COST) {
            await broadcastLivePlatformEvent(GLOBAL_OFFERING_ALERT_EVENT, {
              amount: cost,
              senderName: attendeeName,
              at: new Date().toISOString(),
              userId: initialProfile.userId ?? null,
            });
          }
        }
      } catch (error) {
        console.error("[CLIENT_TRANSACTION_ERROR]", error);
        window.alert("Transaction failed. Please check your seed balance.");
      } finally {
        setIsDeductingSeeds(false);
      }
    },
    [
      attendeeName,
      broadcastLivePlatformEvent,
      initialProfile.userId,
      isDeductingSeeds,
      pushOfferingLedgerEntry,
    ],
  );

  const handleCustomEmojiReaction = useCallback(
    (assetId: string) => {
      const reaction = getLiveReactionDefinition(assetId);

      liveChatRef.current?.postNotice(reaction.chatNotice);
      pushLocalEmojiBurst(reaction.assetId, `Sent ${reaction.label} reaction`);

      void broadcastLivePlatformEvent(EMOJI_BURST_EVENT, {
        assetId: reaction.assetId,
        emojiId: reaction.assetId,
        senderName: attendeeName,
        at: new Date().toISOString(),
        userId: initialProfile.userId ?? null,
      });
    },
    [
      attendeeName,
      broadcastLivePlatformEvent,
      initialProfile.userId,
      pushLocalEmojiBurst,
    ],
  );

  const handleJoinConversation = useCallback(() => {
    setMobileChatOpen(true);
    window.requestAnimationFrame(() => {
      liveChatRef.current?.openComposer();
    });
  }, []);

  const handleQuickSow = useCallback(() => {
    void executeSeedDeduction(
      QUICK_SOW_COST,
      "offering_sow",
      "Sowed 100 Seeds into main sanctuary offering",
    );
  }, [executeSeedDeduction]);

  const isPublishMode = useDirectCamera;
  const showConnectingShroud =
    !isPublishMode &&
    !playbackUrl &&
    (manifest.status === "idle" ||
      manifest.status === "loading" ||
      manifest.status === "waiting" ||
      manifest.status === "error");

  if (showConnectingShroud) {
    return (
      <ExperienceHoldingRoomPageClient
        initialProfile={initialProfile}
        initialCountdownConfig={countdownConfig}
        initialCountdown={initialCountdown}
        showClock
      />
    );
  }

  const resolvedPlaybackUrl = playbackUrl ?? "";
  const showDirectPlayer = isPublishMode && !playbackUrl;
  const walletLabel = seedBalanceLoading ? "..." : seedBalance.toLocaleString("en-US");
  const showAudioUnlock = showDirectPlayer ? !directAudioUnlocked : !audioUnlocked;
  const handleHeaderEnableAudio = showDirectPlayer ? enableDirectAudio : enableAudio;

  return (
    <main
      ref={mainRef}
      className="live-sanctuary-experience min-h-dvh bg-brand-black text-white [--live-mobile-composer-h:0px] [--live-mobile-dock-h:4.5rem]"
    >
      <div className="relative min-h-dvh lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <section className="relative min-h-dvh w-full bg-[#050505]">
          <LiveExperienceHeader
            streamSubtitle="The Awakening"
            streamTitle="Ian Craig & 300"
            viewerCountLabel={viewerCountLabel}
            showAudioUnlock={showAudioUnlock}
            onEnableAudio={handleHeaderEnableAudio}
          />

          <div className="relative h-dvh w-full lg:h-auto lg:min-h-[calc(100dvh-4.5rem)]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black/85 via-black/35 to-transparent max-lg:block lg:hidden" />
            <div className="absolute inset-0 bg-black lg:relative lg:inset-auto lg:h-full lg:min-h-[calc(100dvh-4.5rem)]">
              {showDirectPlayer ? (
                <>
                  <video
                    ref={directVideoRef}
                    className="absolute inset-0 h-full w-full bg-black object-cover lg:object-contain"
                    controls
                    playsInline
                    autoPlay
                    muted={!directAudioUnlocked}
                  />
                  {directStatus !== "ready" ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/72 px-6 text-center">
                      <p className="max-w-sm font-body text-sm text-white/70">
                        Connecting direct camera publisher...
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <HlsVideoPlayer
                  url={resolvedPlaybackUrl}
                  videoRef={videoRef}
                  audioUnlocked={audioUnlocked}
                />
              )}

              <LiveFeatureErrorBoundary featureLabel="Reactions">
                {floatingEmojis.map((burst) => (
                  <CustomEmojiAnimator
                    key={burst.id}
                    assetId={burst.assetId}
                    onComplete={() => dismissFloatingEmoji(burst.id)}
                  />
                ))}
              </LiveFeatureErrorBoundary>
            </div>
          </div>
        </section>

        <aside className="pointer-events-none fixed inset-0 z-30 flex flex-col lg:pointer-events-auto lg:static lg:inset-auto lg:z-auto lg:min-h-dvh lg:border-l lg:border-white/10 lg:bg-brand-panel">
          <div className="hidden lg:block">
            <div className="border-b border-white/10 px-4 py-4 sm:px-5">
              <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-brand-purple">
                Live Activity Ledger
              </p>
              <p className="mt-1 font-body text-sm text-brand-muted">
                Reactions, seeds, and real-time stage energy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
              <span className="inline-flex min-h-11 items-center rounded-full border border-brand-blue/40 bg-brand-blue/10 px-4 font-ui text-[0.72rem] font-bold tracking-[0.08em] text-white">
                ✨ {walletLabel} Seeds
              </span>
              <button
                type="button"
                onClick={handleAddSeeds}
                className="touch-target inline-flex min-h-11 items-center justify-center rounded-full border border-brand-pink/45 bg-brand-pink/10 px-4 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-pink"
              >
                Buy Seeds
              </button>
            </div>

            <LiveFeatureErrorBoundary featureLabel="Reactions">
              <LiveReactionTray
                variant="desktop-grid"
                onReaction={(assetId) => {
                  handleCustomEmojiReaction(assetId);
                }}
              />
            </LiveFeatureErrorBoundary>

            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <button
                type="button"
                disabled={isDeductingSeeds}
                onClick={handleQuickSow}
                className="touch-target inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-pink via-brand-purple to-brand-blue px-5 py-2.5 font-ui text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {"\uD83D\uDE4C SOW 100 SEEDS"}
              </button>
            </div>

            <div className="max-h-36 shrink-0 overflow-y-auto px-4 py-3 sm:px-5">
              {ledgerEntries.length === 0 ? (
                <p className="font-body text-sm text-brand-muted">
                  Tap a reaction to energize the sanctuary feed.
                </p>
              ) : (
                <ul className="space-y-2">
                  {ledgerEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-white/8 bg-black/30 px-3 py-2"
                    >
                      <p className="font-ui text-[0.68rem] font-bold uppercase tracking-[0.08em] text-white">
                        {entry.label}
                      </p>
                      <p className="mt-1 font-body text-xs text-brand-muted">{entry.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <LiveFeatureErrorBoundary featureLabel="Chat">
            <LiveStreamChat
              ref={liveChatRef}
              profile={initialProfile?.userId ? initialProfile : null}
              seedBalance={seedBalance}
              signInHref={EXPERIENCE_LIVE_PATH}
              layout="responsive"
              simulatedMessages={simulatedChatMessages}
              hideMobileComposer
              mobileComposerOpen={mobileChatOpen}
              className="min-h-0 flex-1 lg:border-t lg:border-white/10"
            />
          </LiveFeatureErrorBoundary>

          <LiveFeatureErrorBoundary featureLabel="Actions">
            <LiveMobileDock
              chatOpen={mobileChatOpen}
              onJoinConversation={handleJoinConversation}
              onReaction={(assetId) => {
                handleCustomEmojiReaction(assetId);
              }}
            />
          </LiveFeatureErrorBoundary>

          <footer className="hidden border-t border-white/10 px-5 py-3 font-body text-xs text-white/55 lg:flex lg:items-center lg:justify-between">
            <span>{attendeeName}</span>
            <span>{manifest.message}</span>
          </footer>
        </aside>
      </div>
    </main>
  );
}
