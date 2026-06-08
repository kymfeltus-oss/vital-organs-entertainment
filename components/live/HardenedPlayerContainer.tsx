"use client";

import { motion } from "framer-motion";
import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import FloatingEmoteLayer from "@/components/live/FloatingEmoteLayer";
import type { FloatingEmote } from "@/lib/useLiveEmoteFanout";

const RECONNECT_DELAY_MS = 3_500;

type ExperienceKey = "main_stage" | "crowd_xp" | "musician_xp" | "prayer_layer";

type ManifestFetchResult = {
  playbackUrl: string;
  activeExperience: ExperienceKey;
  activeSource: string;
};

type HardenedPlayerContainerProps = {
  showStreamPaywall: boolean;
  isPassActivating?: boolean;
  streamIsLive: boolean;
  isStreamStateLoading: boolean;
  streamStateError: string | null;
  userEmail: string | null;
  userId: string | null;
  floatingEmotes: FloatingEmote[];
  onDismissEmote: (key: string) => void;
  paywallOverlay?: ReactNode;
};

const EXPERIENCE_OPTIONS: readonly {
  key: ExperienceKey;
  label: string;
  splicingLabel: string;
}[] = [
  {
    key: "main_stage",
    label: "🌱 Main Stage Mix",
    splicingLabel: "Splicing into Main Stage Mix...",
  },
  {
    key: "crowd_xp",
    label: "🔥 Crowd Experience",
    splicingLabel: "Splicing into Crowd Experience...",
  },
  {
    key: "musician_xp",
    label: "🎹 Musician Experience",
    splicingLabel: "Splicing into Musician Experience...",
  },
  {
    key: "prayer_layer",
    label: "🕊️ Prayer Layer",
    splicingLabel: "Splicing into Prayer Layer...",
  },
];

function getExperienceMeta(key: ExperienceKey) {
  return EXPERIENCE_OPTIONS.find((option) => option.key === key) ?? EXPERIENCE_OPTIONS[0];
}

function isExperienceKey(value: unknown): value is ExperienceKey {
  return (
    value === "main_stage" ||
    value === "crowd_xp" ||
    value === "musician_xp" ||
    value === "prayer_layer"
  );
}

function PassActivationOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0B090A]/95 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,0.18),transparent_70%)]" />
      <Loader2 className="relative h-10 w-10 animate-spin text-[#1E40AF]" />
      <p className="relative mt-6 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#1E40AF]">
        Activating Your Pass
      </p>
      <p className="relative mt-2 text-sm text-zinc-400">
        Securing your concert stream access...
      </p>
    </div>
  );
}

function AuthorizingStreamOverlay() {
  return (
    <div className="absolute inset-0 z-28 flex flex-col items-center justify-center bg-[#0B090A]/92 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,0.16),transparent_70%)]" />
      <motion.div
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center px-6 text-center"
      >
        <Loader2 className="h-9 w-9 animate-spin text-[#1E40AF]" />
        <p className="mt-5 max-w-xs text-[0.65rem] font-bold uppercase tracking-[0.26em] text-[#1E40AF]">
          Authorizing Video Stream Security Passes...
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Server-directed manifest resolution in progress
        </p>
      </motion.div>
    </div>
  );
}

function SplicingExperienceOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-[26] flex flex-col items-center justify-center bg-[#0B090A]/90 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.14),transparent_70%)]" />
      <Loader2 className="relative h-8 w-8 animate-spin text-purple-300" />
      <p className="relative mt-5 max-w-xs px-6 text-center text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white">
        {message}
      </p>
    </div>
  );
}

function ReconnectingOverlay() {
  return (
    <div className="absolute inset-0 z-[25] flex flex-col items-center justify-center bg-[#0B090A]/88 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
      <p className="mt-4 max-w-xs px-6 text-center text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white">
        Reconnecting to secure video feed...
      </p>
    </div>
  );
}

function AntiPiracyWatermark({
  userEmail,
  userId,
}: {
  userEmail: string;
  userId: string | null;
}) {
  const [timestamp, setTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimestamp(Date.now());
    }, 1_000);

    return () => clearInterval(intervalId);
  }, []);

  const watermarkLabel = `${userEmail} · ${userId ?? "unknown"} · ${new Date(timestamp).toISOString()}`;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 max-w-[85%] select-none truncate whitespace-nowrap text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white opacity-[0.08]"
      animate={{
        top: ["12%", "48%", "68%", "32%", "12%"],
        left: ["8%", "52%", "22%", "64%", "8%"],
        bottom: ["auto", "auto", "14%", "auto", "auto"],
        right: ["auto", "auto", "auto", "10%", "auto"],
      }}
      transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
    >
      {watermarkLabel}
    </motion.div>
  );
}

export default function HardenedPlayerContainer({
  showStreamPaywall,
  isPassActivating = false,
  streamIsLive,
  isStreamStateLoading,
  streamStateError,
  userEmail,
  userId,
  floatingEmotes,
  onDismissEmote,
  paywallOverlay,
}: HardenedPlayerContainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playbackUrlRef = useRef("");
  const activeSourceRef = useRef("");
  const activeExperienceRef = useRef<ExperienceKey>("main_stage");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const [activeExperience, setActiveExperience] = useState<ExperienceKey>("main_stage");
  const [switchingExperience, setSwitchingExperience] = useState(false);
  const [pendingExperience, setPendingExperience] = useState<ExperienceKey | null>(null);
  const [playbackVersion, setPlaybackVersion] = useState(0);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const currentExperienceLabel = getExperienceMeta(activeExperience).label;
  const switchingExperienceLabel = getExperienceMeta(
    pendingExperience ?? activeExperience,
  ).splicingLabel;

  const shouldAuthorizeStream =
    streamIsLive && !showStreamPaywall && !isPassActivating;

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

  const scheduleSecureReconnectRef = useRef<() => void>(() => undefined);
  const bindPlaybackSourceRef = useRef<(sourceUrl: string) => void>(() => undefined);
  const loadExperienceRef = useRef<
    (
      experienceKey: ExperienceKey,
      options?: { silent?: boolean; showAuthorizing?: boolean },
    ) => Promise<ManifestFetchResult | null>
  >(() => Promise.resolve(null));

  const markPlaybackReady = useCallback(() => {
    setIsReconnecting(false);
    setSwitchingExperience(false);
    setPendingExperience(null);
    setIsStreamPlaying(true);
  }, []);

  const loadExperience = useCallback(
    async (
      experienceKey: ExperienceKey,
      options?: { silent?: boolean; showAuthorizing?: boolean },
    ): Promise<ManifestFetchResult | null> => {
      if (!shouldAuthorizeStream) {
        return null;
      }

      if (options?.showAuthorizing) {
        setIsAuthorizing(true);
      }

      try {
        const response = await fetch(
          `/api/stream/manifest?experience=${experienceKey}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          playbackUrlRef.current = "";
          activeSourceRef.current = "";
          setSwitchingExperience(false);
          setPendingExperience(null);
          setIsReconnecting(true);
          scheduleSecureReconnectRef.current();
          return null;
        }

        const data = (await response.json()) as {
          success?: boolean;
          playbackUrl?: string;
          activeExperience?: string;
          activeSource?: string;
        };

        const playbackUrl = data.playbackUrl?.trim() ?? "";
        const resolvedExperience = isExperienceKey(data.activeExperience)
          ? data.activeExperience
          : experienceKey;

        if (!data.success || !playbackUrl) {
          playbackUrlRef.current = "";
          activeSourceRef.current = "";
          setSwitchingExperience(false);
          setPendingExperience(null);
          setIsReconnecting(true);
          scheduleSecureReconnectRef.current();
          return null;
        }

        playbackUrlRef.current = playbackUrl;
        activeSourceRef.current = data.activeSource?.trim() ?? "";
        activeExperienceRef.current = resolvedExperience;
        setActiveExperience(resolvedExperience);
        setPlaybackVersion((current) => current + 1);
        setIsReconnecting(false);

        return {
          playbackUrl,
          activeExperience: resolvedExperience,
          activeSource: activeSourceRef.current,
        };
      } catch {
        playbackUrlRef.current = "";
        activeSourceRef.current = "";
        setSwitchingExperience(false);
        setPendingExperience(null);
        setIsReconnecting(true);
        scheduleSecureReconnectRef.current();
        return null;
      } finally {
        if (options?.showAuthorizing) {
          setIsAuthorizing(false);
        }
      }
    },
    [shouldAuthorizeStream],
  );

  const bindPlaybackSource = useCallback(
    (sourceUrl: string) => {
      const video = videoRef.current;
      if (!video || !sourceUrl || !shouldAuthorizeStream) {
        return;
      }

      destroyPlayer();

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        void video.play().catch(() => undefined);
        return;
      }

      if (!Hls.isSupported()) {
        setIsStreamPlaying(false);
        setSwitchingExperience(false);
        setPendingExperience(null);
        setIsReconnecting(true);
        scheduleSecureReconnectRef.current();
        return;
      }

      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        markPlaybackReady();
        void video.play().catch(() => undefined);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        setIsStreamPlaying(false);
        setSwitchingExperience(false);
        scheduleSecureReconnectRef.current();
      });
    },
    [destroyPlayer, markPlaybackReady, shouldAuthorizeStream],
  );

  const scheduleSecureReconnect = useCallback(() => {
    if (!shouldAuthorizeStream || !isMountedRef.current) {
      return;
    }

    clearReconnectTimer();
    setIsReconnecting(true);
    setIsStreamPlaying(false);

    reconnectTimerRef.current = setTimeout(() => {
      void loadExperienceRef
        .current(activeExperienceRef.current, { silent: true })
        .then((result) => {
          if (!isMountedRef.current) return;

          if (result?.playbackUrl) {
            bindPlaybackSourceRef.current(result.playbackUrl);
            return;
          }

          scheduleSecureReconnectRef.current();
        });
    }, RECONNECT_DELAY_MS);
  }, [clearReconnectTimer, shouldAuthorizeStream]);

  useEffect(() => {
    bindPlaybackSourceRef.current = bindPlaybackSource;
    scheduleSecureReconnectRef.current = scheduleSecureReconnect;
    loadExperienceRef.current = loadExperience;
  }, [bindPlaybackSource, loadExperience, scheduleSecureReconnect]);

  useEffect(() => {
    activeExperienceRef.current = activeExperience;
  }, [activeExperience]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldAuthorizeStream) {
      queueMicrotask(() => {
        playbackUrlRef.current = "";
        activeSourceRef.current = "";
        activeExperienceRef.current = "main_stage";
        setActiveExperience("main_stage");
        setSwitchingExperience(false);
        setPendingExperience(null);
        setIsAuthorizing(false);
        setIsStreamPlaying(false);
        setIsReconnecting(false);
        setPlaybackVersion(0);
      });
      clearReconnectTimer();
      destroyPlayer();
      return;
    }

    queueMicrotask(() => {
      void loadExperience("main_stage", { showAuthorizing: true });
    });
  }, [clearReconnectTimer, destroyPlayer, loadExperience, shouldAuthorizeStream]);

  useEffect(() => {
    if (!shouldAuthorizeStream || !playbackUrlRef.current || playbackVersion === 0) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const markLive = () => {
      markPlaybackReady();
    };
    const markOffline = () => {
      setSwitchingExperience(false);
      scheduleSecureReconnectRef.current();
    };

    video.addEventListener("playing", markLive);
    video.addEventListener("error", markOffline);

    bindPlaybackSource(playbackUrlRef.current);

    return () => {
      video.removeEventListener("playing", markLive);
      video.removeEventListener("error", markOffline);
    };
  }, [bindPlaybackSource, markPlaybackReady, playbackVersion, shouldAuthorizeStream]);

  useEffect(() => {
    return () => {
      clearReconnectTimer();
      destroyPlayer();
    };
  }, [clearReconnectTimer, destroyPlayer]);

  const handleExperienceSelect = useCallback(
    (experienceKey: ExperienceKey) => {
      if (experienceKey === activeExperience || switchingExperience) return;

      setPendingExperience(experienceKey);
      setSwitchingExperience(true);
      setIsStreamPlaying(false);

      void loadExperience(experienceKey).then((result) => {
        if (!result?.playbackUrl) {
          setSwitchingExperience(false);
          setPendingExperience(null);
        }
      });
    },
    [activeExperience, loadExperience, switchingExperience],
  );

  const showOfflineArtwork =
    !showStreamPaywall &&
    (!streamIsLive || isStreamStateLoading) &&
    !isPassActivating;
  const showVideo = shouldAuthorizeStream;
  const videoVisible =
    isStreamPlaying && !isReconnecting && !isAuthorizing && !switchingExperience;
  const showWatermark =
    Boolean(userEmail) &&
    showVideo &&
    !isReconnecting &&
    !isAuthorizing &&
    !switchingExperience &&
    isStreamPlaying;

  return (
    <div className="relative flex h-full min-h-[50dvh] flex-1 flex-col overflow-hidden rounded-2xl border border-[#1E40AF]/40 bg-black shadow-[0_0_30px_rgba(30,64,175,0.25)] md:min-h-[480px]">
      <div className="relative min-h-[50dvh] flex-1 md:min-h-[420px]">
        <FloatingEmoteLayer emotes={floatingEmotes} onDismiss={onDismissEmote} />

        {showVideo && (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${
              videoVisible ? "opacity-100" : "opacity-0"
            }`}
            controls={videoVisible}
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            playsInline
            autoPlay
            muted
          />
        )}

        {showWatermark && userEmail && (
          <AntiPiracyWatermark userEmail={userEmail} userId={userId} />
        )}

        {showOfflineArtwork && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B090A]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,0.2),transparent_70%)]" />
            {isStreamStateLoading ? (
              <Loader2 className="relative h-8 w-8 animate-spin text-[#1E40AF]" />
            ) : (
              <motion.span
                animate={{ opacity: [1, 0.45, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-full border border-[#1E40AF]/60 bg-[#1E40AF]/15 px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(30,64,175,0.45)]"
              >
                Live Tonight 7:30 PM CST
              </motion.span>
            )}
          </div>
        )}

        {showVideo && isAuthorizing && !switchingExperience && (
          <AuthorizingStreamOverlay />
        )}
        {showVideo && switchingExperience && (
          <SplicingExperienceOverlay message={switchingExperienceLabel} />
        )}
        {showVideo && isReconnecting && !isAuthorizing && !switchingExperience && (
          <ReconnectingOverlay />
        )}
        {isPassActivating && <PassActivationOverlay />}

        {streamStateError && !showStreamPaywall && (
          <p className="absolute bottom-4 left-4 right-4 z-10 rounded-xl border border-[#B0267A]/40 bg-[#B0267A]/10 px-3 py-2 text-center text-xs text-zinc-200">
            {streamStateError}
          </p>
        )}

        {paywallOverlay}
      </div>

      {showVideo && (
        <div className="relative z-40 shrink-0 border-t border-white/10 bg-[#0B090A]/95 px-4 py-3 backdrop-blur-md">
          <p className="mb-3 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Awakening Experience Switcher
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((option) => {
              const isActive = activeExperience === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`Switch to ${option.label}`}
                  disabled={switchingExperience || isAuthorizing}
                  onClick={() => handleExperienceSelect(option.key)}
                  className={
                    isActive
                      ? "rounded-full border border-purple-500/80 bg-purple-600/20 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] backdrop-blur-md transition"
                      : "rounded-full border border-white/5 bg-black/30 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-zinc-400 transition hover:border-purple-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[0.58rem] uppercase tracking-[0.16em] text-zinc-600">
            Active feed: {currentExperienceLabel}
          </p>
        </div>
      )}
    </div>
  );
}
