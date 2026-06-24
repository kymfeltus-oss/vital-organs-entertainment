"use client";

import Link from "next/link";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Cloud,
  Image,
  Layers,
  Smartphone,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import LiveHubPreviewPlayer from "@/components/live-hub/LiveHubPreviewPlayer";
import { useLocalWebcam } from "@/hooks/useLocalWebcam";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { copyToClipboard } from "@/lib/clipboard";
import { initializeMobileUploadPipeline } from "@/lib/ops/mobile-upload-pipeline";
import { resolveActiveOpsPreviewHlsUrl } from "@/lib/ops/resolve-active-stream-playback";

type CameraDeskSourceId = "cam-1" | "canon_xa60" | "phone_2" | "graphics";

type CameraDeskSource = {
  id: CameraDeskSourceId;
  label: string;
  sublabel: string;
  icon: typeof Smartphone;
};

const CAMERA_SOURCES: readonly CameraDeskSource[] = [
  {
    id: "cam-1",
    label: "CAM 1",
    sublabel: "This Phone",
    icon: Smartphone,
  },
  {
    id: "canon_xa60",
    label: "Canon XA60",
    sublabel: "Stage Wide",
    icon: Video,
  },
  {
    id: "phone_2",
    label: "Phone 2",
    sublabel: "Stage Close",
    icon: Smartphone,
  },
  {
    id: "graphics",
    label: "Graphics",
    sublabel: "Overlay",
    icon: Image,
  },
] as const;

type CameraDeskMobileViewProps = {
  phoneStreamKey?: string | null;
};

export default function CameraDeskMobileView({
  phoneStreamKey = null,
}: CameraDeskMobileViewProps) {
  const { stream: opsStream } = useOpsStreamStateRealtime();
  const [activeSource, setActiveSource] = useState<CameraDeskSourceId>("cam-1");
  const [phoneFeedEnabled, setPhoneFeedEnabled] = useState(false);
  const sessionStreamKey = phoneStreamKey;
  const [toast, setToast] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const phoneVideoRef = useRef<HTMLVideoElement>(null);
  const uploadSessionRef = useRef<ReturnType<typeof initializeMobileUploadPipeline> | null>(
    null,
  );

  const phoneCamActive = phoneFeedEnabled && activeSource === "cam-1";
  const localStream = useLocalWebcam(phoneCamActive);

  const monitorHlsUrl = useMemo(
    () => resolveActiveOpsPreviewHlsUrl(opsStream),
    [opsStream],
  );

  const isLive = opsStream?.isLive === true;
  const isCloudFailover = opsStream?.activeSource === "backup";
  const isInternalStudio = opsStream?.studioEngineMode === "internal_studio";

  useEffect(() => {
    const video = phoneVideoRef.current;
    if (!video || !localStream || !phoneCamActive) return;

    video.srcObject = localStream;
    void video.play().catch(() => undefined);

    if (sessionStreamKey) {
      uploadSessionRef.current = initializeMobileUploadPipeline(
        localStream,
        sessionStreamKey,
      );
    }
  }, [localStream, phoneCamActive, sessionStreamKey]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const handleSourceSwitch = useCallback(
    async (sourceId: CameraDeskSourceId) => {
      setActiveSource(sourceId);
      if (sourceId !== "cam-1") {
        setPhoneFeedEnabled(false);
      }
      setIsBusy(true);

      try {
        const response = await fetch("/api/broadcast/command", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_preview", sourceId }),
          cache: "no-store",
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Unable to switch camera source.");
        }

        showToast(`Preview switched to ${sourceId.replace(/_/g, " ")}.`);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Unable to switch camera source.",
        );
      } finally {
        setIsBusy(false);
      }
    },
    [showToast],
  );

  const togglePhoneFeed = useCallback(async () => {
    if (phoneFeedEnabled) {
      setPhoneFeedEnabled(false);
      showToast("Phone camera feed stopped.");
      return;
    }

    setPhoneFeedEnabled(true);
    setActiveSource("cam-1");
    await handleSourceSwitch("cam-1");
  }, [handleSourceSwitch, phoneFeedEnabled, showToast]);

  const handleInvitePhone = useCallback(async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/dashboard/broadcast?webrtc=1&t=${Date.now()}`;
    const ok = await copyToClipboard(inviteUrl);
    showToast(ok ? "Invite link copied." : inviteUrl);
  }, [showToast]);

  const handleSwapToCloud = useCallback(async () => {
    setIsBusy(true);
    try {
      const response = await fetch("/api/ops/stream-action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_backup" }),
        cache: "no-store",
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to swap to cloud path.");
      }

      showToast("Routing switched to Restream cloud backup.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to swap to cloud path.");
    } finally {
      setIsBusy(false);
    }
  }, [showToast]);

  const triggerEmergencyFailover = useCallback(async () => {
    setIsBusy(true);
    try {
      const response = await fetch("/api/ops/stream-health", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success?: boolean;
        status?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failover request failed.");
      }

      if (data.status === "healthy") {
        showToast("Primary ingest healthy — no failover needed.");
        return;
      }

      if (data.status?.startsWith("failover_triggered")) {
        showToast("Emergency failover engaged — cloud backup is now active.");
        return;
      }

      showToast(`Health check: ${data.status ?? "complete"}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failover request failed.");
    } finally {
      setIsBusy(false);
    }
  }, [showToast]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg select-none flex-col overflow-x-hidden bg-brand-black px-[clamp(0.75rem,3vw,1rem)] pb-safe pt-safe font-body text-white">
      <header className="mb-4 flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <Smartphone className="h-5 w-5 shrink-0 text-brand-purple" aria-hidden="true" />
          <h1 className="truncate font-headline text-sm uppercase tracking-[0.14em]">
            300A Operator Console
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 font-ui text-[0.62rem] font-bold uppercase ${
              isLive
                ? "animate-pulse bg-brand-pink/20 text-brand-pink"
                : "bg-brand-panel text-brand-muted"
            }`}
          >
            {isLive ? "Live" : "Idle"}
          </span>
          <Link
            href={OPS_HOME_PATH}
            className="touch-target rounded-lg p-1 text-brand-muted transition hover:bg-brand-panel hover:text-white"
            aria-label="Close operator console"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section aria-label="Active camera feed">
        <p className="mb-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          My Active Cameras
        </p>
        <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl border border-brand-border bg-brand-panel shadow-[0_0_24px_rgba(138,46,255,0.12)]">
          {phoneCamActive && localStream ? (
            <video
              ref={phoneVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              aria-label="CAM 1 phone camera preview"
            />
          ) : monitorHlsUrl ? (
            <div className="absolute inset-0">
              <LiveHubPreviewPlayer playbackUrl={monitorHlsUrl} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center text-brand-muted">
              <Video className="mb-2 h-8 w-8 text-brand-muted/60" aria-hidden="true" />
              <p className="font-ui text-xs font-bold uppercase">
                Viewing Remote Feed: {activeSource.replace(/_/g, " ")}
              </p>
              <p className="mt-1 font-body text-[0.62rem]">Monitoring active production master</p>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isBusy || !sessionStreamKey}
          onClick={() => void togglePhoneFeed()}
          aria-pressed={phoneFeedEnabled}
          className={`touch-target mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-ui text-[0.62rem] font-bold uppercase tracking-[0.1em] transition disabled:opacity-60 ${
            phoneFeedEnabled
              ? "border-brand-pink/50 bg-brand-pink/15 text-brand-pink"
              : "border-brand-purple/50 bg-brand-purple/15 text-brand-purple"
          }`}
        >
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
          {phoneFeedEnabled ? "Stop Phone Feed (CAM 1)" : "Feed Phone Lens to CAM 1"}
        </button>
        {sessionStreamKey ? (
          <p className="mt-2 truncate font-mono text-[0.58rem] text-brand-blue" title={sessionStreamKey}>
            Session key: {sessionStreamKey}
          </p>
        ) : null}
      </section>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-border bg-brand-panel/80 p-2.5 font-ui text-[0.62rem] text-brand-muted">
        <span className="inline-flex items-center gap-1.5">
          {isInternalStudio ? (
            <>
              <Layers className="h-3.5 w-3.5 text-brand-purple" aria-hidden="true" />
              App Studio Engine
            </>
          ) : (
            <>
              <Cloud className="h-3.5 w-3.5 text-brand-pink" aria-hidden="true" />
              Restream Cloud Bridge
            </>
          )}
        </span>
        <button
          type="button"
          disabled={isBusy || isCloudFailover}
          onClick={() => void handleSwapToCloud()}
          className="touch-target rounded-md border border-brand-purple/40 bg-brand-purple/10 px-2 py-1 font-bold uppercase tracking-[0.08em] text-brand-purple transition hover:bg-brand-purple/20 disabled:opacity-50"
        >
          Swap to Cloud
        </button>
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col">
        <h2 className="mb-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          Video Source Mixer (Tap to Switch)
        </h2>
        <div className="grid grid-cols-2 gap-[clamp(0.5rem,2vw,0.75rem)] pb-4">
          {CAMERA_SOURCES.map((source) => {
            const Icon = source.icon;
            const isActive = activeSource === source.id;
            const isCam1Live = source.id === "cam-1" && phoneFeedEnabled;

            return (
              <button
                key={source.id}
                type="button"
                disabled={isBusy}
                onClick={() => void handleSourceSwitch(source.id)}
                className={`touch-target flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-xl border p-3 font-ui text-xs font-bold transition-all disabled:opacity-60 sm:min-h-[6rem] sm:p-4 ${
                  isActive
                    ? "border-brand-purple/60 bg-brand-purple/15 text-brand-purple shadow-[0_0_16px_rgba(138,46,255,0.18)]"
                    : "border-brand-border bg-brand-panel/60 text-brand-muted hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{source.label}</span>
                <span className="text-[0.58rem] font-normal normal-case text-brand-muted">
                  {isCam1Live ? "Live · This Device" : source.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-auto grid grid-cols-2 gap-2 border-t border-brand-border pt-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handleInvitePhone()}
          className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-brand-border bg-brand-panel py-3 font-ui text-xs font-bold text-brand-muted transition hover:text-white disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          + Invite Phone
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void triggerEmergencyFailover()}
          className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 py-3 font-ui text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-60"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Trigger Failover
        </button>
      </footer>

      {toast ? (
        <p
          role="status"
          className="fixed bottom-24 left-4 right-4 z-50 rounded-lg border border-brand-blue/40 bg-brand-panel px-3 py-2 text-center font-ui text-xs text-brand-blue shadow-lg"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
