"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Cloud, HeartPulse, Radio, RotateCw, Settings } from "lucide-react";
import { useDeviceInventoryStore } from "@/hooks/use-device-inventory-store";
import {
  useVideoHubControlStore,
  type DestinationKey,
} from "@/hooks/use-video-hub-control-store";
import { useProductionLiveStore, useProductionLiveSync } from "@/hooks/use-production-live-data";
import { useVideoHubSwitcher } from "@/hooks/use-video-hub-switcher";
import {
  initializeWebBroadcaster,
  updateLiveCameraChannel,
  type IvsBroadcastStatus,
} from "@/lib/broadcast/ivs-web-broadcaster";
import type { ShowSetupState } from "@/lib/owner/show-setup-state";
import { formatLiveStartLabel } from "@/lib/owner/video-hub-ui";

type IngestCredentialsResponse = {
  backup?: {
    ingestServer: string | null;
    streamKey: string | null;
    channelName: string | null;
    playbackUrl: string | null;
    detail: string | null;
  };
};

type ShowSetupResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  state?: ShowSetupState;
};

type VideoHubControlPatch = {
  chatEnabled?: boolean;
  chatSlowMode?: boolean;
  dvrBufferEnabled?: boolean;
  restreamDestinations?: Partial<Record<DestinationKey, boolean>>;
};

function VideoSurface({ stream, className = "" }: { stream: MediaStream | null; className?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
    if (stream) void ref.current.play().catch(() => undefined);
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className={`h-full w-full bg-black object-cover ${className}`}
    />
  );
}

function ShellPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[12px] border border-[#34224E] bg-[#070A17]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_24px_rgba(157,0,255,0.12)] ${className}`}
    >
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  icon,
  disabled = false,
  dataTestId,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  dataTestId: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-1">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <p className="truncate font-body text-lg font-semibold text-white">{label}</p>
      </div>
      <button
        data-testid={dataTestId}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`flex h-8 w-16 shrink-0 items-center rounded-full p-1 transition ${
          checked
            ? "bg-gradient-to-r from-[#0050A8] to-[#00DDEB] shadow-[0_0_18px_rgba(0,221,235,0.45)]"
            : "bg-[#252d54]"
        } disabled:opacity-45`}
      >
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-8" : ""}`} />
      </button>
    </div>
  );
}

export default function VideoHubControlClient() {
  useProductionLiveSync();
  const {
    availableCameras,
    activeMasterStream,
    activeDeviceId,
    permissionState,
    error,
    refreshHardware,
    switchMasterChannel,
  } = useVideoHubSwitcher();
  const [ingest, setIngest] = useState<IngestCredentialsResponse["backup"] | null>(null);
  const [ingestLoading, setIngestLoading] = useState(true);
  const [broadcastStatus, setBroadcastStatus] = useState<IvsBroadcastStatus>("idle");
  const [broadcastMessage, setBroadcastMessage] = useState("Browser broadcast has not started.");
  const [showSetup, setShowSetup] = useState<ShowSetupState | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("Loading live control settings...");
  const [fadePending, setFadePending] = useState(false);
  const [switchPending, setSwitchPending] = useState<string | null>(null);
  const [pendingControlKey, setPendingControlKey] = useState<string | null>(null);
  const [hardwareRefreshing, setHardwareRefreshing] = useState(false);
  const [broadcastStarting, setBroadcastStarting] = useState(false);
  const {
    chatEnabled,
    slowMode,
    dvrEnabled,
    destinations,
    hydrate,
    setChatEnabled,
    setSlowMode,
    setDvrEnabled,
    setDestinationEnabled,
  } = useVideoHubControlStore();
  const { cameras: inventoryCameras, error: inventoryError } = useDeviceInventoryStore();
  const switchProgramVideoFeed = useProductionLiveStore((state) => state.switchProgramVideoFeed);
  const updateRestreamTarget = useProductionLiveStore((state) => state.updateRestreamTarget);

  useEffect(() => {
    let cancelled = false;
    async function loadLiveState() {
      setIngestLoading(true);
      setSettingsLoading(true);
      try {
        const [ingestResponse, setupResponse] = await Promise.all([
          fetch("/api/owner/ingest/credentials", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/owner/show-setup", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        const ingestData = (await ingestResponse.json()) as IngestCredentialsResponse;
        const setupData = (await setupResponse.json()) as ShowSetupResponse;
        if (!cancelled) {
          setIngest(ingestData.backup ?? null);
          if (setupResponse.ok && setupData.state) {
            setShowSetup(setupData.state);
            hydrate(setupData.state);
            setSettingsMessage("Live control settings loaded.");
          } else {
            setSettingsMessage(setupData.error ?? "Unable to load control settings.");
          }
        }
      } catch {
        if (!cancelled) {
          setIngest(null);
          setSettingsMessage("Live control settings failed to load.");
        }
      } finally {
        if (!cancelled) {
          setIngestLoading(false);
          setSettingsLoading(false);
        }
      }
    }
    void loadLiveState();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const handleTakeCutDirect = useCallback(
    async (deviceId: string) => {
      if (switchPending || fadePending) return;
      setSwitchPending(deviceId);
      setBroadcastMessage("Switching program camera...");
      try {
        const nextStream = await switchMasterChannel(deviceId);
        if (nextStream && broadcastStatus === "broadcasting") {
          const result = await updateLiveCameraChannel(nextStream);
          setBroadcastMessage(result.message);
        } else if (nextStream) {
          setBroadcastMessage("Program camera switched locally.");
        }
        await switchProgramVideoFeed(deviceId, "CUT");
      } catch (switchError) {
        setBroadcastMessage(
          switchError instanceof Error ? switchError.message : "Camera switch failed.",
        );
      } finally {
        setSwitchPending(null);
      }
    },
    [broadcastStatus, fadePending, switchMasterChannel, switchPending, switchProgramVideoFeed],
  );

  const handleAutoFadeMix = useCallback(async () => {
    if (fadePending || switchPending) return;
    if (!activeDeviceId) {
      setBroadcastMessage("Select a camera before running Auto Fade Mix.");
      return;
    }

    setFadePending(true);
    setBroadcastMessage("Auto Fade Mix preparing program transition.");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const nextStream = await switchMasterChannel(activeDeviceId);
      if (nextStream && broadcastStatus === "broadcasting") {
        const result = await updateLiveCameraChannel(nextStream);
        setBroadcastMessage(result.ok ? "Auto Fade Mix applied to live program." : result.message);
      } else if (nextStream) {
        setBroadcastMessage("Auto Fade Mix applied to local program preview.");
      }
      await switchProgramVideoFeed(activeDeviceId, "AUTO_FADE");
    } catch (transitionError) {
      setBroadcastMessage(
        transitionError instanceof Error ? transitionError.message : "Auto Fade Mix failed.",
      );
    } finally {
      setFadePending(false);
    }
  }, [
    activeDeviceId,
    broadcastStatus,
    fadePending,
    switchMasterChannel,
    switchPending,
    switchProgramVideoFeed,
  ]);

  const handleStartBroadcast = useCallback(async () => {
    if (broadcastStarting || broadcastStatus === "broadcasting") return;
    setBroadcastStarting(true);
    try {
      const endpoint = ingest?.ingestServer ?? "";
      const streamKey = ingest?.streamKey ?? "";
      const result = await initializeWebBroadcaster(endpoint, streamKey, activeMasterStream);
      setBroadcastStatus(result.status);
      setBroadcastMessage(result.message);
    } catch (startError) {
      setBroadcastStatus("error");
      setBroadcastMessage(
        startError instanceof Error ? startError.message : "Unable to start browser broadcast.",
      );
    } finally {
      setBroadcastStarting(false);
    }
  }, [
    activeMasterStream,
    broadcastStarting,
    broadcastStatus,
    ingest,
  ]);

  const handleRefreshHardware = useCallback(async () => {
    if (hardwareRefreshing) return;
    setHardwareRefreshing(true);
    try {
      await refreshHardware();
      setBroadcastMessage("Camera hardware refreshed.");
    } catch (refreshError) {
      setBroadcastMessage(
        refreshError instanceof Error ? refreshError.message : "Camera hardware refresh failed.",
      );
    } finally {
      setHardwareRefreshing(false);
    }
  }, [hardwareRefreshing, refreshHardware]);

  const persistControlPatch = useCallback(
    async (patch: VideoHubControlPatch, successMessage: string) => {
      const response = await fetch("/api/owner/show-setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as ShowSetupResponse;
      if (!response.ok || !data.state) {
        throw new Error(data.error ?? "Unable to persist live control setting.");
      }
      setShowSetup(data.state);
      hydrate(data.state);
      setSettingsMessage(data.message ?? successMessage);
    },
    [hydrate],
  );

  const handleChatEnabledChange = useCallback(
    async (value: boolean) => {
      if (settingsSaving || pendingControlKey) return;
      const previous = chatEnabled;
      setPendingControlKey("chat");
      setSettingsSaving(true);
      setChatEnabled(value);
      setSettingsMessage("Saving live chat gateway setting...");
      try {
        await persistControlPatch({ chatEnabled: value }, "Live chat gateway saved.");
      } catch (settingError) {
        setChatEnabled(previous);
        setSettingsMessage(
          settingError instanceof Error
            ? settingError.message
            : "Live chat gateway save failed. Previous value restored.",
        );
      } finally {
        setPendingControlKey(null);
        setSettingsSaving(false);
      }
    },
    [
      chatEnabled,
      pendingControlKey,
      persistControlPatch,
      setChatEnabled,
      settingsSaving,
    ],
  );

  const handleSlowModeChange = useCallback(
    async (value: boolean) => {
      if (settingsSaving || pendingControlKey) return;
      const previous = slowMode;
      setPendingControlKey("slow-mode");
      setSettingsSaving(true);
      setSlowMode(value);
      setSettingsMessage("Saving chat slow-mode setting...");
      try {
        await persistControlPatch({ chatSlowMode: value }, "Chat slow-mode saved.");
      } catch (settingError) {
        setSlowMode(previous);
        setSettingsMessage(
          settingError instanceof Error
            ? settingError.message
            : "Chat slow-mode save failed. Previous value restored.",
        );
      } finally {
        setPendingControlKey(null);
        setSettingsSaving(false);
      }
    },
    [pendingControlKey, persistControlPatch, setSlowMode, settingsSaving, slowMode],
  );

  const handleDvrEnabledChange = useCallback(
    async (value: boolean) => {
      if (settingsSaving || pendingControlKey) return;
      const previous = dvrEnabled;
      setPendingControlKey("dvr");
      setSettingsSaving(true);
      setDvrEnabled(value);
      setSettingsMessage("Saving DVR buffer setting...");
      try {
        await persistControlPatch({ dvrBufferEnabled: value }, "DVR buffer setting saved.");
      } catch (settingError) {
        setDvrEnabled(previous);
        setSettingsMessage(
          settingError instanceof Error
            ? settingError.message
            : "DVR buffer save failed. Previous value restored.",
        );
      } finally {
        setPendingControlKey(null);
        setSettingsSaving(false);
      }
    },
    [dvrEnabled, pendingControlKey, persistControlPatch, setDvrEnabled, settingsSaving],
  );

  const handleDestinationChange = useCallback(
    async (destination: DestinationKey, value: boolean) => {
      if (settingsSaving || pendingControlKey) return;
      const previous = destinations[destination];
      const nextDestinations = {
        ...destinations,
        [destination]: value,
      };
      setPendingControlKey(`destination-${destination}`);
      setSettingsSaving(true);
      setDestinationEnabled(destination, value);
      setSettingsMessage(`Saving ${destination} relay target...`);
      try {
        await persistControlPatch(
          { restreamDestinations: nextDestinations },
          `${destination} relay target saved.`,
        );
        await updateRestreamTarget(destination, value);
      } catch (settingError) {
        setDestinationEnabled(destination, previous);
        setSettingsMessage(
          settingError instanceof Error
            ? settingError.message
            : `${destination} relay save failed. Previous value restored.`,
        );
      } finally {
        setPendingControlKey(null);
        setSettingsSaving(false);
      }
    },
    [
      destinations,
      pendingControlKey,
      persistControlPatch,
      setDestinationEnabled,
      settingsSaving,
      updateRestreamTarget,
    ],
  );

  const handleSaveControlSettings = useCallback(async () => {
    if (settingsSaving) return;
    setSettingsSaving(true);
    setSettingsMessage("Saving live control settings...");
    try {
      const response = await fetch("/api/owner/show-setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatEnabled,
          chatSlowMode: slowMode,
          dvrBufferEnabled: dvrEnabled,
          restreamDestinations: destinations,
        }),
      });
      const data = (await response.json()) as ShowSetupResponse;
      if (!response.ok || !data.state) {
        throw new Error(data.error ?? "Unable to save live control settings.");
      }
      setShowSetup(data.state);
      hydrate(data.state);
      setSettingsMessage(data.message ?? "Live control settings saved.");
    } catch (saveError) {
      setSettingsMessage(
        saveError instanceof Error ? saveError.message : "Live control settings save failed.",
      );
    } finally {
      setSettingsSaving(false);
    }
  }, [chatEnabled, destinations, dvrEnabled, hydrate, settingsSaving, slowMode]);

  const visibleCameras = useMemo(() => availableCameras.slice(0, 6), [availableCameras]);
  const linkedInventoryCameras = useMemo(
    () => inventoryCameras.filter((camera) => camera.healthStatus === "LINKED"),
    [inventoryCameras],
  );
  const hasIvsConfig = Boolean(ingest?.ingestServer && ingest.streamKey);
  const captureOk = permissionState === "granted" && visibleCameras.length > 0;
  const mediaActionPending = Boolean(switchPending) || fadePending || broadcastStarting;
  const liveStartLabel = formatLiveStartLabel(showSetup?.targetDateTime);
  const showTitle = showSetup?.showTitle ?? "Summer Concert Series - Night 1";
  const showLead = showSetup?.presenterName ?? "Producer";
  const enabledDestinationCount = Object.values(destinations).filter(Boolean).length;
  const programSegments = showSetup?.programFlow?.length
    ? showSetup.programFlow.slice(0, 2)
    : [
        { id: "1", title: "Opening Countdown", description: "", durationMinutes: 5 },
        { id: "2", title: "Host Welcome", description: "", durationMinutes: 10 },
      ];
  const gateLabel = showSetup?.gateControl === "EARLY_ACCESS" ? "Early Access" : "Doors Lockout";
  const orderCode = showSetup?.targetDateTime
    ? `#${new Date(showSetup.targetDateTime).getTime().toString(16).slice(-6).toUpperCase()}`
    : "#LIVE01";

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#02040A] px-3 py-4 text-white sm:px-4 lg:px-5">
      <div className="pointer-events-none fixed inset-0 opacity-80" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(0,221,235,0.11),transparent_26%),radial-gradient(circle_at_82%_16%,rgba(255,47,207,0.15),transparent_28%),linear-gradient(180deg,#030611_0%,#02040A_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1680px]">
        <header className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[6px] border border-[#42B6FF]/60 bg-black/30 font-headline text-5xl leading-none text-transparent shadow-[0_0_18px_rgba(236,0,255,0.22)] [-webkit-text-stroke:1px_#00DDEB]">
              P
            </div>
            <div>
              <p className="font-ui text-lg uppercase tracking-[0.3em] text-white">Parable</p>
              <p className="font-body text-[0.65rem] uppercase tracking-[0.36em] text-[#9eb1d9]">Entertainment</p>
            </div>
          </div>
          <div className="h-14 w-px bg-white/15" />
          <div className="min-w-0 flex-1">
            <h1 className="font-headline text-3xl uppercase tracking-[0.02em] sm:text-4xl">
              <span className="text-[#D853FF]">Video</span> / Live Stream{" "}
              <span className="text-[#60B9FF]">Hub</span>
            </h1>
            <p className="font-body text-sm uppercase tracking-[0.18em] text-white/75">
              Control. Stream. Inspire.
            </p>
          </div>
          <div className="flex min-h-12 w-full items-center justify-between rounded-[10px] border border-[#7B3DFF]/55 bg-[#130A28]/80 px-4 lg:w-auto lg:min-w-[26rem] 2xl:min-w-[33rem]">
            <p className="font-body text-base font-semibold sm:text-lg">Start Broadcast & Cloud Relay Path</p>
            <span className="rounded-[7px] border border-[#7B3DFF]/45 bg-[#23123e] px-4 py-2 font-ui text-sm uppercase text-[#B8A7FF]">
              Module 2
            </span>
          </div>
          <button
            data-testid="video-hub-refresh-devices-button"
            type="button"
            disabled={hardwareRefreshing}
            onClick={() => void handleRefreshHardware()}
            className="grid h-14 w-14 place-items-center rounded-[10px] border border-[#7B3DFF]/55 bg-[#130A28]/80 text-[#B8C8FF] disabled:opacity-45"
          >
            <Settings className={`h-6 w-6 ${hardwareRefreshing ? "animate-spin" : ""}`} />
          </button>
        </header>

        <section className="mb-3 grid gap-3 2xl:grid-cols-[1.55fr_0.83fr]">
          <ShellPanel className="flex min-h-28 flex-wrap items-center gap-y-4 divide-white/14 px-4 lg:flex-nowrap lg:divide-x lg:px-6">
            <div className="flex min-w-[14rem] items-center gap-4 pr-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#291260] text-[#9B65FF] shadow-[0_0_22px_rgba(123,61,255,0.4)]">
                <Radio className="h-9 w-9" />
              </div>
              <div>
                <p className="font-headline text-4xl leading-none tracking-[0.04em] lg:text-5xl">00:10:00</p>
                <p className="text-center font-body text-base uppercase text-white/75">To Start</p>
              </div>
            </div>
            <div className="px-4 lg:px-6">
              <p className="font-headline text-4xl leading-none tracking-[0.04em] lg:text-5xl">02:50</p>
              <p className="text-center font-body text-base uppercase text-white/75">Duration</p>
            </div>
            <div className="min-w-[16rem] flex-1 px-4 lg:px-6">
              <h2 className="font-headline text-2xl text-white lg:text-3xl">{showTitle}</h2>
              <p className="mt-1 font-body text-lg text-[#FF4CDA]">{showLead}</p>
            </div>
            <div className="min-w-[10rem] pl-4 lg:pl-6">
              <p className="font-ui text-lg uppercase text-[#FF4CDA]">{gateLabel}</p>
              <p className="font-body text-sm uppercase text-white/55">Order of Service</p>
              <p className="font-body text-xl font-bold">{orderCode}</p>
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <p className="mb-4 font-ui text-sm uppercase text-white">
              Start Broadcast & Cloud Relay Path <span className="text-[#FF4CDA]">(Module 2)</span>
            </p>
            <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-[8px] border border-[#00DDEB] bg-[#061528] p-4 shadow-[0_0_20px_rgba(0,221,235,0.45)]">
                <p className="font-body text-base font-bold">
                  AWS IVS <span className="font-normal">(Sovereign Cloud)</span>
                </p>
                <p className="font-body text-sm text-white/80">
                  Ingest: {hasIvsConfig ? "RTMPS Active" : "Not configured"}
                </p>
                <p className="font-body text-sm text-white/75">Live ingest path</p>
                <p className="font-body text-lg font-bold text-[#22E66B]">
                  {ingestLoading ? "Loading" : ingest?.detail ?? "Awaiting credentials."}
                </p>
              </div>
              <div className="grid place-items-center text-4xl text-[#22E66B]">{"<->"}</div>
              <div className="rounded-[8px] border border-[#FF4CDA] bg-[#1b0824] p-4 shadow-[0_0_20px_rgba(255,76,218,0.45)]">
                <p className="font-body text-base font-bold">
                  Restream Relay <span className="font-normal">(Multi-Platform)</span>
                </p>
                <p className="font-body text-sm text-white/80">
                  Status: {settingsLoading ? "Loading" : `Mirroring ${enabledDestinationCount} Channels`}
                </p>
                <p className="font-body text-sm text-white/75">Restream matrix</p>
                <p className="font-body text-lg font-bold text-[#22E66B]">
                  {settingsMessage.includes("failed") ? "Check settings" : "Success: #22E66B"}
                </p>
              </div>
            </div>
          </ShellPanel>
        </section>

        <section className="grid gap-4 2xl:grid-cols-[0.84fr_0.96fr]">
          <ShellPanel className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl text-[#8A2EFF]">::</span>
              <h2 className="font-body text-2xl font-bold">Camera Operator</h2>
              <span className="font-body text-base text-[#00A7FF]">(Module 3)</span>
            </div>
            <p className="mb-3 font-ui text-sm uppercase tracking-[0.04em] text-white/70">
              Master Program Output
            </p>
            <div className="grid gap-4 lg:grid-cols-[7rem_1fr]">
              <div className="space-y-4 font-body text-xl uppercase text-white/65">
                {["Master", "Program", "Love Dry", "Output"].map((label) => (
                  <div
                    key={label}
                    className={
                      label === "Master"
                        ? "rounded-[6px] bg-[#191754] px-4 py-3 font-bold text-white"
                        : "px-4 py-2"
                    }
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="aspect-video overflow-hidden rounded-[12px] border-2 border-[#FF4CDA] bg-black shadow-[0_0_28px_rgba(255,76,218,0.62)]">
                <VideoSurface stream={activeMasterStream} />
              </div>
            </div>

            <div className="mx-auto mt-5 grid max-w-[42rem] gap-4 sm:grid-cols-2">
              <button
                data-testid="video-hub-take-cutdirect-button"
                type="button"
                disabled={!activeDeviceId || mediaActionPending}
                onClick={() => activeDeviceId && void handleTakeCutDirect(activeDeviceId)}
                className="min-h-16 rounded-[9px] border border-[#8A2EFF] bg-[#160B34] px-4 font-ui text-lg font-black uppercase shadow-[0_0_18px_rgba(138,46,255,0.7)] disabled:opacity-40"
              >
                {switchPending ? "[ Switching ]" : "[ Take Cutdirect ]"}
              </button>
              <button
                data-testid="video-hub-auto-fade-mix-button"
                type="button"
                disabled={!activeDeviceId || mediaActionPending}
                onClick={() => void handleAutoFadeMix()}
                className="min-h-16 rounded-[9px] border border-[#FF4CDA] bg-[#160B34] px-4 font-ui text-lg font-black uppercase text-white shadow-[0_0_18px_rgba(255,76,218,0.55)] disabled:opacity-45"
              >
                {fadePending ? "[ Fading ]" : "[ Auto Fade Mix ]"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_20rem] 2xl:grid-cols-[1fr_24rem] xl:items-end">
              <div>
                <h3 className="font-body text-2xl font-bold">{showTitle}</h3>
                <p className="font-body text-base text-[#B8A7FF]">{showLead}</p>
                <p className="font-ui text-base uppercase text-[#FF4CDA]">{gateLabel}</p>
                <p className="font-body text-sm text-white/65">Order of Service</p>
                {programSegments.map((segment, index) => (
                  <p key={segment.id} className="font-body text-sm text-white/55">
                    {index + 1}. {segment.title}
                  </p>
                ))}
                <p className="mt-2 font-body text-sm text-white/70">
                  Status: <span className="text-[#22E66B]">{broadcastStatus}</span> | {broadcastMessage}
                </p>
                <p className="font-body text-xs text-white/45">{liveStartLabel}</p>
                {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
              </div>
              <button
                data-testid="video-hub-go-live-button"
                type="button"
                disabled={
                  !activeMasterStream ||
                  !hasIvsConfig ||
                  broadcastStatus === "broadcasting" ||
                  broadcastStarting
                }
                onClick={() => void handleStartBroadcast()}
                className="min-h-24 rounded-[12px] border-2 border-[#00DDEB] bg-gradient-to-r from-[#FF2FAF] via-[#7B3DFF] to-[#00A7FF] p-3 shadow-[0_0_32px_rgba(255,47,175,0.65)] disabled:opacity-45"
              >
                <span className="block rounded-[9px] border border-white/70 py-4 font-ui text-3xl font-black tracking-[0.08em] lg:text-4xl">
                  {broadcastStarting ? "STARTING" : "GO LIVE"}
                </span>
                <span className="mt-2 block font-body text-base">Premium Gold (#F4C542)</span>
              </button>
            </div>
          </ShellPanel>

          <div className="grid gap-4">
            <ShellPanel className="p-5">
              <h2 className="font-body text-2xl font-bold">
                Multistream Sources <span className="font-body text-base text-[#00A7FF]">(Module 3)</span>
              </h2>
              <p className="font-ui text-sm uppercase tracking-[0.08em] text-white/50">
                Camera Sources Grid
              </p>
              {inventoryError ? <p className="mt-2 text-sm text-red-300">{inventoryError}</p> : null}
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {visibleCameras.map((camera, index) => {
                  const routedCamera = linkedInventoryCameras[index] ?? null;
                  const labels = [
                    "Stage Center",
                    "Band Drums",
                    "Lead Vocal",
                    "Crowd Wide",
                    "Webcam 1",
                    "Capture Card B",
                  ];
                  return (
                    <button
                      data-testid={`video-hub-camera-source-${index + 1}`}
                      type="button"
                      key={camera.deviceId}
                      disabled={mediaActionPending}
                      onClick={() => void handleTakeCutDirect(camera.deviceId)}
                      className={`group min-h-36 overflow-hidden rounded-[9px] border bg-black text-left shadow-[0_0_18px_rgba(0,0,0,0.35)] disabled:opacity-45 ${
                        activeDeviceId === camera.deviceId
                          ? "border-[#FF4CDA] shadow-[0_0_22px_rgba(255,76,218,0.7)]"
                          : index % 3 === 1
                            ? "border-[#8A2EFF] shadow-[0_0_16px_rgba(138,46,255,0.45)]"
                            : "border-[#00A7FF] shadow-[0_0_16px_rgba(0,167,255,0.45)]"
                      }`}
                    >
                      <div className="relative h-36 bg-black">
                        {activeDeviceId === camera.deviceId ? (
                          <VideoSurface stream={activeMasterStream} />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#17233b] to-black">
                            <Camera className="h-10 w-10 text-white/45" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                          <p className="font-ui text-2xl font-black uppercase leading-none">
                            {index + 1}.{" "}
                            {routedCamera?.displayName.split("(")[0].trim() ||
                              labels[index] ||
                              camera.label}
                          </p>
                          <p className="font-body text-sm text-white/75">
                            {routedCamera ? routedCamera.sovereignIngestArn : "Inter: Description"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {visibleCameras.length === 0 ? (
                  <div className="rounded-lg border border-white/10 p-5 text-white/60">
                    No browser camera inputs are available yet.
                  </div>
                ) : null}
              </div>
              <p className="mt-3 font-ui text-base font-bold text-[#22E66B]">
                [ {captureOk ? "WebRTC Active" : permissionState} ] Capturing {visibleCameras.length} local inputs
              </p>
            </ShellPanel>

            <div className="grid gap-4 md:grid-cols-2">
              <ShellPanel className="p-5">
                <h2 className="font-body text-2xl font-bold">Restream Target Control</h2>
                <p className="font-body text-sm text-white/55">Cloud mirror destinations</p>
                <div className="mt-5 space-y-4">
                  <ToggleRow
                    icon={<span className="font-ui text-2xl font-black text-[#9146FF]">TW</span>}
                    label="Twitch (SarahStreaming)"
                    checked={destinations.twitch}
                    disabled={settingsLoading || settingsSaving}
                    dataTestId="video-hub-restream-twitch-toggle"
                    onChange={(value) => void handleDestinationChange("twitch", value)}
                  />
                  <ToggleRow
                    icon={<span className="font-ui text-2xl font-black text-red-500">YT</span>}
                    label="YouTube Live"
                    checked={destinations.youtube}
                    disabled={settingsLoading || settingsSaving}
                    dataTestId="video-hub-restream-youtube-toggle"
                    onChange={(value) => void handleDestinationChange("youtube", value)}
                  />
                  <ToggleRow
                    icon={<span className="font-ui text-2xl font-black text-[#1877F2]">FB</span>}
                    label="Facebook Gaming"
                    checked={destinations.facebook}
                    disabled={settingsLoading || settingsSaving}
                    dataTestId="video-hub-restream-facebook-toggle"
                    onChange={(value) => void handleDestinationChange("facebook", value)}
                  />
                </div>
                <p className="mt-4 font-ui text-base uppercase text-[#B66BFF]">
                  Restream Channels <span className="font-body normal-case text-white/45">(Cloud Mirror)</span>
                </p>
              </ShellPanel>

              <ShellPanel className="p-5">
                <h2 className="font-body text-2xl font-bold">Essential Operational System Toggles</h2>
                <p className="font-body text-sm text-white/55">Live audience controls</p>
                <div className="mt-5 space-y-4">
                  <ToggleRow
                    label="Live Chat Gateway"
                    checked={chatEnabled}
                    disabled={settingsLoading || settingsSaving}
                    dataTestId="video-hub-live-chat-toggle"
                    onChange={(value) => void handleChatEnabledChange(value)}
                  />
                  <ToggleRow
                    label="Chat Slow-Mode (1 msg/5s)"
                    checked={slowMode}
                    disabled={settingsLoading || settingsSaving}
                    dataTestId="video-hub-chat-slow-mode-toggle"
                    onChange={(value) => void handleSlowModeChange(value)}
                  />
                  <ToggleRow
                    label="DVR Buffer (30 Min Rewind)"
                    checked={dvrEnabled}
                    disabled={settingsLoading || settingsSaving}
                    dataTestId="video-hub-dvr-buffer-toggle"
                    onChange={(value) => void handleDvrEnabledChange(value)}
                  />
                </div>
                <button
                  data-testid="video-hub-apply-control-settings-button"
                  type="button"
                  disabled={settingsLoading || settingsSaving}
                  onClick={() => void handleSaveControlSettings()}
                  className="mt-5 min-h-11 w-full rounded-lg border border-[#8A2EFF] bg-[#8A2EFF]/25 px-4 font-ui text-xs font-black uppercase text-white shadow-[0_0_18px_rgba(138,46,255,0.45)] disabled:opacity-45"
                >
                  {settingsSaving ? "Saving..." : "Apply Live Control Settings"}
                </button>
              </ShellPanel>
            </div>
          </div>
        </section>

        <footer className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#253657] bg-[#071022]/90 px-7 py-3 font-body text-base text-[#B8C8FF]">
          <span className="flex items-center gap-3">
            <Cloud className="h-5 w-5" /> Dashboard connected to Parable Cloud{" "}
            <span className="text-[#22E66B]">(OK)</span>
          </span>
          <span className="flex items-center gap-3">
            <HeartPulse className="h-5 w-5 text-[#00DDEB]" /> System Health: Optimal
          </span>
          <span className="flex items-center gap-3">
            <RotateCw className="h-5 w-5 text-[#00DDEB]" /> Last Sync: 10:02:15 AM CDT
          </span>
          <span>Uptime: 23h 14m</span>
        </footer>
      </div>
    </main>
  );
}
