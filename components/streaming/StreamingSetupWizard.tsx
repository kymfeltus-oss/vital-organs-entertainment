"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import ChurchWebsiteForm from "@/components/streaming/ChurchWebsiteForm";
import CustomRtmpForm from "@/components/streaming/CustomRtmpForm";
import { platformLabel } from "@/components/streaming/PlatformLogo";
import TestConnectionResult from "@/components/streaming/TestConnectionResult";
import WizardStepPlaceholder from "@/components/streaming/wizard/WizardStepPlaceholder";
import WizardErrorBoundary from "@/components/streaming/WizardErrorBoundary";
import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import {
  createStreamingDestinationApi,
  detectStreamingEncodersApi,
  disconnectStreamingApi,
  fetchStreamingPreviewStatsApi,
  fetchStreamingWizardDefaultsApi,
  prepareStreamingEncoderApi,
  runStreamingNetworkTestApi,
  saveStreamingBroadcastDestinationsApi,
  saveStreamingWizardApi,
  startStreamingOAuthApi,
  testStreamingDestinationApi,
  updateStreamingDestinationApi,
} from "@/lib/streaming/api";
import { normalizeChurchWebsiteSettings, createDefaultChurchWebsiteSettings, withChurchWebsiteDefaults } from "@/lib/streaming/church-website-shared";
import { STREAMING_PLATFORMS, normalizePlatform } from "@/lib/streaming/platforms";
import { buildBroadcastDestinationCards } from "@/lib/streaming/broadcast-catalog";
import {
  DEFAULT_AUDIO_PROFILE,
  DEFAULT_VIDEO_PROFILE,
  STREAMING_PLATFORM_SPECS,
  STREAMING_WIZARD_STEPS,
  connectionQualityLabel,
  formatVideoProfileLabel,
  parseAudioProfile,
  parseNetworkTest,
  parseVideoProfile,
  wizardStepIndex,
  wizardStepLabel,
  type StreamingAudioProfile,
  type StreamingNetworkTest,
  type StreamingVideoProfile,
  type StreamingWizardStep,
} from "@/lib/streaming/setup";
import { openBrowserAudioMonitor } from "@/lib/sound/browser";
import { extractBrowserDeviceId } from "@/lib/sound/device-utils";
import { toIsoFromLocalDateTimeInput, toLocalDateTimeInput } from "@/lib/streaming/datetime-local";
import { WIZARD_BODY_MIN_HEIGHT } from "@/lib/streaming/streaming-layout";
import type { ChurchWebsiteSettings, CustomRtmpSettings, StreamingPlatform, StreamingTestResult } from "@/lib/streaming/types";
import type { SoundItem, StreamingDestination, BroadcastDestinationCard } from "@/lib/todays-service/types";

const BroadcastDestinationChooser = dynamic(
  () => import("@/components/streaming/BroadcastDestinationChooser"),
  { loading: () => <WizardStepPlaceholder /> },
);
const SoundDeviceMeter = dynamic(() => import("@/components/todays-service/sound/SoundDeviceMeter"), {
  loading: () => <div className="h-16 animate-pulse rounded-lg bg-white/5" aria-hidden="true" />,
});

type StreamingSetupWizardProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  destinations: StreamingDestination[];
  broadcastDestinationCards?: BroadcastDestinationCard[];
  soundItems: SoundItem[];
  resumeDestinationId?: string | null;
  resumeStep?: StreamingWizardStep | null;
};

export default function StreamingSetupWizard({
  open,
  onClose,
  onSaved,
  onToast,
  destinations,
  broadcastDestinationCards,
  soundItems,
  resumeDestinationId,
  resumeStep,
}: StreamingSetupWizardProps) {
  const [step, setStep] = useState<StreamingWizardStep>("choose");
  const [platform, setPlatform] = useState<StreamingPlatform | "">("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<StreamingPlatform[]>([]);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devMessage, setDevMessage] = useState<string | null>(null);

  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamCategory, setStreamCategory] = useState("Religion & Spirituality");
  const [privacy, setPrivacy] = useState("public");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [tags, setTags] = useState("church, live, worship");

  const [videoProfile, setVideoProfile] = useState<StreamingVideoProfile>({ ...DEFAULT_VIDEO_PROFILE });
  const [audioProfile, setAudioProfile] = useState<StreamingAudioProfile>({ ...DEFAULT_AUDIO_PROFILE });
  const [selectedSoundItemId, setSelectedSoundItemId] = useState("");
  const [encoder, setEncoder] = useState<string>("x264");
  const [detectedEncoders, setDetectedEncoders] = useState<string[]>(["x264"]);
  const [gpuName, setGpuName] = useState<string | null>(null);
  const [av1Supported, setAv1Supported] = useState(false);

  const [networkTest, setNetworkTest] = useState<StreamingNetworkTest | null>(null);
  const [networkRunning, setNetworkRunning] = useState(false);
  const [testResult, setTestResult] = useState<StreamingTestResult | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const [previewStats, setPreviewStats] = useState<Awaited<ReturnType<typeof fetchStreamingPreviewStatsApi>> | null>(null);
  const [previewVideoReady, setPreviewVideoReady] = useState(false);
  const [liveLevels, setLiveLevels] = useState<Record<string, unknown>>({});
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const wizardHydratedResumeIdRef = useRef<string | null>(null);
  const audioMonitorStop = useRef<(() => void) | null>(null);
  const destinationIdRef = useRef<string | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  const [churchWebsite, setChurchWebsite] = useState<ChurchWebsiteSettings>(() =>
    createDefaultChurchWebsiteSettings(),
  );
  const [customRtmp, setCustomRtmp] = useState<CustomRtmpSettings>({
    serverName: "",
    streamUrl: "",
    streamKey: "",
    backupStreamUrl: "",
  });

  const chooserCards = useMemo(
    () =>
      Array.isArray(broadcastDestinationCards) && broadcastDestinationCards.length > 0
        ? broadcastDestinationCards
        : buildBroadcastDestinationCards({ destinations, selections: [] }),
    [broadcastDestinationCards, destinations],
  );

  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  useEffect(() => {
    destinationIdRef.current = destinationId;
  }, [destinationId]);

  const normalizedPlatform = useMemo(
    () => (platform ? normalizePlatform(platform) : ""),
    [platform],
  );

  const activeDestination = useMemo(
    () => destinations.find((d) => d.id === destinationId) ?? null,
    [destinations, destinationId],
  );

  const isOAuthPlatform =
    Boolean(normalizedPlatform) &&
    normalizedPlatform !== "church_website" &&
    normalizedPlatform !== "custom_rtmp";
  const isConnected =
    activeDestination?.connectionStatus === "connected" || activeDestination?.connectionStatus === "ready";

  const resetWizard = useCallback(() => {
    setStep("choose");
    setPlatform("");
    setSelectedPlatforms([]);
    setDestinationId(null);
    destinationIdRef.current = null;
    setDevMessage(null);
    setNetworkTest(null);
    setTestResult(null);
    setPreviewStats(null);
    setPreviewVideoReady(false);
    audioMonitorStop.current?.();
    audioMonitorStop.current = null;
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    previewStreamRef.current = null;
    setChurchWebsite(createDefaultChurchWebsiteSettings());
  }, []);

  const hydrateFromDestination = useCallback((dest: StreamingDestination) => {
    setDestinationId(dest.id);
    destinationIdRef.current = dest.id;
    setPlatform(normalizePlatform(dest.platform) as StreamingPlatform);
    setStreamTitle(dest.streamTitle);
    setStreamDescription(dest.streamDescription);
    setStreamCategory(dest.streamCategory ?? "Religion & Spirituality");
    setPrivacy(dest.privacy || "public");
    setThumbnailUrl(dest.thumbnailUrl);
    setScheduledStartAt(toLocalDateTimeInput(dest.scheduledStartAt));
    setTags(dest.streamTags?.join(", ") ?? "church, live, worship");
    setVideoProfile(parseVideoProfile(dest.videoProfileJson));
    setAudioProfile(parseAudioProfile(dest.audioProfileJson));
    const settings = dest.settingsJson as Record<string, unknown>;
    if (dest.platform === "church_website") {
      setChurchWebsite(
        withChurchWebsiteDefaults({
          websiteName: String(settings.websiteName ?? dest.websiteName ?? dest.destinationName ?? ""),
          streamPageUrl: String(settings.streamPageUrl ?? dest.streamPageUrl ?? ""),
          embedMethod: String(settings.embedMethod ?? dest.embedMethod ?? "iframe"),
        }),
      );
    }
    if (dest.platform === "custom_rtmp") {
      setCustomRtmp({
        serverName: String(settings.serverName ?? dest.destinationName ?? ""),
        streamUrl: "",
        streamKey: "",
        backupStreamUrl: "",
      });
    }
    const enc = dest.encoderProfileJson as { encoder?: string; detectedEncoders?: string[]; gpuName?: string };
    if (enc.encoder) setEncoder(enc.encoder);
    if (enc.detectedEncoders) setDetectedEncoders(enc.detectedEncoders);
    if (enc.gpuName) setGpuName(enc.gpuName);
    const net = parseNetworkTest(dest.networkTestJson);
    if (net) setNetworkTest(net);
  }, []);

  useEffect(() => {
    if (!open) {
      resetWizard();
      wizardHydratedResumeIdRef.current = null;
      return;
    }
  }, [open, resetWizard]);

  useEffect(() => {
    if (!open) return;
    void fetchStreamingWizardDefaultsApi()
      .then((defaults) => {
        setStreamTitle((prev) => prev || defaults.streamTitle);
        setStreamDescription((prev) => prev || defaults.streamDescription);
        setScheduledStartAt((prev) => prev || toLocalDateTimeInput(defaults.scheduledStartAt));
        setStreamCategory((prev) => prev || defaults.category);
        setPrivacy((prev) => prev || defaults.privacy);
        setTags((prev) => prev || defaults.tags.join(", "));
        setChurchWebsite((prev) =>
          withChurchWebsiteDefaults({
            ...prev,
            websiteName: prev.websiteName || defaults.churchWebsite.websiteName,
            streamPageUrl: prev.streamPageUrl || defaults.churchWebsite.streamPageUrl,
            embedMethod: prev.embedMethod || defaults.churchWebsite.embedMethod,
          }),
        );
      })
      .catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!open || !resumeDestinationId) return;
    if (wizardHydratedResumeIdRef.current === resumeDestinationId) return;

    const dest = destinations.find((d) => d.id === resumeDestinationId);
    if (!dest) return;

    wizardHydratedResumeIdRef.current = resumeDestinationId;
    hydrateFromDestination(dest);
    setStep(resumeStep ?? "stream-info");
  }, [open, resumeDestinationId, resumeStep, destinations, hydrateFromDestination]);

  const handleChooserContinue = async (platforms: StreamingPlatform[]) => {
    setBusy(true);
    try {
      const result = await saveStreamingBroadcastDestinationsApi(platforms);
      setSelectedPlatforms(platforms);
      const first = platforms[0];
      const platformKey = normalizePlatform(first) as StreamingPlatform;
      setPlatform(platformKey);
      const card = result.cards.find((c) => normalizePlatform(c.platform) === platformKey);
      const cardDestId = card?.destinationId ?? null;
      if (cardDestId) {
        setDestinationId(cardDestId);
        destinationIdRef.current = cardDestId;
      }
      const dest =
        destinations.find((d) => d.id === cardDestId) ??
        destinations.find((d) => normalizePlatform(d.platform) === platformKey) ??
        null;
      if (dest) hydrateFromDestination(dest);
      void onSaved();
      setStep("authenticate");
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not save destination selections.");
    } finally {
      setBusy(false);
    }
  };

  const ensureDestination = useCallback(async (): Promise<string> => {
    if (destinationIdRef.current) return destinationIdRef.current;
    if (!platform) throw new Error("Choose a streaming destination first.");

    const platformKey = normalizePlatform(platform);
    const existing = destinations.find((d) => normalizePlatform(d.platform) === platformKey);
    if (existing) {
      destinationIdRef.current = existing.id;
      setDestinationId(existing.id);
      return existing.id;
    }

    const meta = STREAMING_PLATFORMS.find((p) => p.id === platformKey);
    const normalizedChurch = normalizeChurchWebsiteSettings(withChurchWebsiteDefaults(churchWebsite));
    const item = await createStreamingDestinationApi({
      platform: platformKey as StreamingPlatform,
      displayName: platformKey === "church_website" ? normalizedChurch.websiteName : meta?.label,
      settings:
        platformKey === "church_website"
          ? normalizedChurch
          : platformKey === "custom_rtmp"
            ? { serverName: customRtmp.serverName }
            : {},
      streamUrl: platformKey === "custom_rtmp" ? customRtmp.streamUrl : normalizedChurch.streamPageUrl,
      streamKey: platformKey === "custom_rtmp" ? customRtmp.streamKey : undefined,
      backupStreamUrl: customRtmp.backupStreamUrl,
    });
    destinationIdRef.current = item.id;
    setDestinationId(item.id);
    return item.id;
  }, [churchWebsite, customRtmp, destinations, platform]);

  const runEncoderDetect = useCallback(async () => {
    const result = await detectStreamingEncodersApi();
    setDetectedEncoders(result.detectedEncoders);
    setEncoder(result.recommended);
    setGpuName(result.gpuName);
    setAv1Supported(result.av1Supported);
  }, []);

  useEffect(() => {
    if (open && step === "video") void runEncoderDetect().catch(() => undefined);
  }, [open, step, runEncoderDetect]);

  const startOAuth = async () => {
    const id = await ensureDestination();
    const oauth = await startStreamingOAuthApi(platform, id);
    if (oauth.authorizationUrl) {
      window.location.href = oauth.authorizationUrl;
      return;
    }
    setDevMessage(oauth.developmentMessage);
    onToast("error", oauth.developmentMessage ?? "OAuth is not configured on this production machine.");
  };

  const saveDraft = async (nextStep?: StreamingWizardStep) => {
    const id = destinationId ?? (await ensureDestination());
    const scheduledIso = toIsoFromLocalDateTimeInput(scheduledStartAt);
    await saveStreamingWizardApi({
      destinationId: id,
      streamTitle,
      streamDescription,
      streamCategory,
      privacy,
      thumbnailUrl,
      scheduledStartAt: scheduledIso,
      streamTags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      videoProfile: videoProfile as unknown as Record<string, unknown>,
      audioProfile: audioProfile as unknown as Record<string, unknown>,
      encoderProfile: { encoder, detectedEncoders, gpuName },
      networkTest: networkTest as unknown as Record<string, unknown> | undefined,
      connectionQuality: networkTest?.streamingQuality,
      latencyMode: platform ? STREAMING_PLATFORM_SPECS[platform as StreamingPlatform]?.latencyMode : undefined,
    });
    await onSaved();
    if (nextStep) setStep(nextStep);
  };

  const persistConnectionSettings = async (destId: string, platformKey = normalizedPlatform) => {
    if (platformKey === "church_website") {
      const normalized = normalizeChurchWebsiteSettings(withChurchWebsiteDefaults(churchWebsite));
      await updateStreamingDestinationApi(destId, {
        destinationName: normalized.websiteName || "Church Website",
        settingsJson: normalized,
        streamUrl: normalized.streamPageUrl,
        websiteName: normalized.websiteName,
        websiteUrl: normalized.websiteUrl,
        streamPageUrl: normalized.streamPageUrl,
        embedMethod: normalized.embedMethod,
        connectionStatus: "connected",
        validationStatus: "not_validated",
        validationReason: null,
        lastValidationError: null,
      });
      setChurchWebsite({
        websiteName: normalized.websiteName,
        streamPageUrl: normalized.streamPageUrl,
        embedMethod: normalized.embedMethod,
      });
      return;
    }
    if (platformKey === "custom_rtmp") {
      await updateStreamingDestinationApi(destId, {
        destinationName: customRtmp.serverName || "Custom RTMP",
        settingsJson: { serverName: customRtmp.serverName },
        streamUrl: customRtmp.streamUrl,
        streamKey: customRtmp.streamKey,
        backupStreamUrl: customRtmp.backupStreamUrl,
        connectionStatus: "connected",
      });
    }
  };

  const goNext = async () => {
    const idx = wizardStepIndex(step);
    const next = STREAMING_WIZARD_STEPS[idx + 1];
    if (!next) return;

    if (step === "authenticate" && isOAuthPlatform && !isConnected) {
      onToast("error", "Connect your account before continuing.");
      return;
    }
    if (step === "network" && !networkTest) {
      onToast("error", "Run the connection test before continuing.");
      return;
    }
    if (step === "destination-test" && !testResult?.success) {
      onToast("error", "Destination must pass validation before preview.");
      return;
    }

    const persistOnAuthenticate =
      step === "authenticate" &&
      (normalizedPlatform === "church_website" || normalizedPlatform === "custom_rtmp");

    if (persistOnAuthenticate) {
      setStep(next);
      setBusy(true);
      try {
        const id = await ensureDestination();
        await persistConnectionSettings(id, normalizedPlatform);
        void onSaved?.();
      } catch (err) {
        setStep("authenticate");
        onToast("error", err instanceof Error ? err.message : "Could not save connection settings.");
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      if (step === "choose") {
        await ensureDestination();
      } else if (["stream-info", "video", "audio", "preview"].includes(step)) {
        await saveDraft();
      }
      setStep(next);
      if (step === "authenticate" || step === "choose") {
        void onSaved?.();
      }
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not continue.");
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    const idx = wizardStepIndex(step);
    if (idx > 0) setStep(STREAMING_WIZARD_STEPS[idx - 1]);
  };

  const runNetworkTest = async () => {
    setNetworkRunning(true);
    try {
      const id = await ensureDestination();
      const result = await runStreamingNetworkTestApi(id, videoProfile as unknown as Record<string, unknown>);
      setNetworkTest(result);
      if (result.recommendedBitrateKbps > 0) {
        setVideoProfile((v) => ({ ...v, bitrateKbps: result.recommendedBitrateKbps }));
      }
      await onSaved();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Network test failed.");
    } finally {
      setNetworkRunning(false);
    }
  };

  const runDestinationTest = async () => {
    setTestRunning(true);
    setTestResult(null);
    try {
      const id = await ensureDestination();
      await saveDraft();
      const result = await testStreamingDestinationApi(id);
      setTestResult(result);
      await onSaved();
      onToast(result.success ? "success" : "error", result.message);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Destination test failed.");
    } finally {
      setTestRunning(false);
    }
  };

  const startPreview = async () => {
    const id = await ensureDestination();
    try {
      await prepareStreamingEncoderApi(id);
    } catch {
      /* encoder may be unavailable — still show camera preview */
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      previewStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        await previewVideoRef.current.play();
        setPreviewVideoReady(true);
      }
    } catch {
      setPreviewVideoReady(false);
    }
    if (audioProfile.source) {
      await startAudioMeters();
    }
    const pollStats = async () => {
      if (!open || step !== "preview") return;
      try {
        const stats = await fetchStreamingPreviewStatsApi(id);
        setPreviewStats(stats);
      } catch {
        /* ignore */
      }
      setTimeout(pollStats, 2000);
    };
    void pollStats();
  };

  useEffect(() => {
    if (step === "preview" && open) void startPreview().catch(() => undefined);
    return () => {
      audioMonitorStop.current?.();
      previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  const finishWizard = async () => {
    setBusy(true);
    try {
      const id = await ensureDestination();
      await saveStreamingWizardApi({
        destinationId: id,
        streamTitle,
        streamDescription,
        streamCategory,
        privacy,
        thumbnailUrl,
        scheduledStartAt: toIsoFromLocalDateTimeInput(scheduledStartAt),
        streamTags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        videoProfile: videoProfile as unknown as Record<string, unknown>,
        audioProfile: audioProfile as unknown as Record<string, unknown>,
        encoderProfile: { encoder, detectedEncoders, gpuName },
        networkTest: networkTest as unknown as Record<string, unknown> | undefined,
        connectionQuality: networkTest?.streamingQuality,
        latencyMode: platform ? STREAMING_PLATFORM_SPECS[platform as StreamingPlatform]?.latencyMode : undefined,
        selectedForToday: true,
        markReady: true,
      });
      await onSaved();
      onToast("success", "Streaming setup complete. Ready to stream.");
      resetWizard();
      onClose();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not save streaming setup.");
    } finally {
      setBusy(false);
    }
  };

  const mixerOptions = useMemo(() => soundItems.filter((s) => s.category === "mixer"), [soundItems]);
  const micOptions = useMemo(() => soundItems.filter((s) => s.category !== "mixer"), [soundItems]);
  const stepProgress = useMemo(
    () => ((wizardStepIndex(step) + 1) / STREAMING_WIZARD_STEPS.length) * 100,
    [step],
  );

  const continueDisabled = useMemo(() => {
    if (!platform) return true;
    if (step === "authenticate") {
      if (isOAuthPlatform && !isConnected) return true;
      if (normalizedPlatform === "church_website") {
        const normalized = normalizeChurchWebsiteSettings(withChurchWebsiteDefaults(churchWebsite));
        return !normalized.websiteName.trim() || !normalized.streamPageUrl.trim();
      }
      if (normalizedPlatform === "custom_rtmp") {
        return !customRtmp.streamUrl.trim() || !customRtmp.streamKey.trim();
      }
    }
    if (step === "save" && !testResult?.success) return true;
    return false;
  }, [
    churchWebsite,
    customRtmp,
    isConnected,
    isOAuthPlatform,
    normalizedPlatform,
    platform,
    step,
    testResult?.success,
  ]);

  const handleContinueClick = () => {
    if (busy) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[StreamingSetupWizard] Continue clicked while busy", { step });
      }
      return;
    }
    if (continueDisabled) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[StreamingSetupWizard] Continue disabled dead click", {
          step,
          platform: normalizedPlatform,
        });
      }
      return;
    }
    void goNext();
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      footerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, step]);

  const startAudioMeters = useCallback(async () => {
    audioMonitorStop.current?.();
    const item = soundItems.find((s) => s.id === selectedSoundItemId);
    const browserId = item ? extractBrowserDeviceId(item.deviceId) : null;
    if (!browserId) return;
    try {
      const monitor = await openBrowserAudioMonitor(browserId);
      audioMonitorStop.current = monitor.stop;
      const tick = () => {
        setLiveLevels(monitor.readLevels());
        if (open) requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* permission or device unavailable */
    }
  }, [open, selectedSoundItemId, soundItems]);

  useEffect(() => {
    if (open && step === "audio" && selectedSoundItemId) void startAudioMeters();
    return () => audioMonitorStop.current?.();
  }, [open, step, selectedSoundItemId, startAudioMeters]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 pt-safe pb-safe">
      <div
        ref={panelRef}
        {...dialogProps}
        className={`${TS.panel} flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl`}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id={titleId} className="font-headline text-xl uppercase tracking-[0.08em] text-white">
            {step === "choose" ? "Broadcast Setup" : wizardStepLabel(step)}
          </h2>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-brand-blue transition-all" style={{ width: `${stepProgress}%` }} />
          </div>
          <p className="mt-2 font-ui text-[0.55rem] uppercase tracking-[0.14em] text-white/45">
            Step {wizardStepIndex(step) + 1} of {STREAMING_WIZARD_STEPS.length}
          </p>
        </div>

        <div className={`flex-1 overflow-y-auto px-5 py-4 ${WIZARD_BODY_MIN_HEIGHT}`}>
          <WizardErrorBoundary stepLabel={wizardStepLabel(step)}>
          {step === "choose" ? (
            <BroadcastDestinationChooser
              cards={chooserCards}
              initialSelected={selectedPlatforms.length ? selectedPlatforms : undefined}
              busy={busy}
              onContinue={handleChooserContinue}
            />
          ) : null}

          {step === "authenticate" && selectedPlatforms.length > 1 ? (
            <div className="mb-4 rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="font-ui text-[0.5rem] uppercase tracking-wider text-white/45">Selected for today</p>
              <ul className="mt-2 space-y-1 font-body text-sm text-white/75">
                {selectedPlatforms.map((p) => {
                  const dest = destinations.find((d) => d.platform === p);
                  const label = platformLabel(p);
                  const connected = dest?.connectionStatus === "connected" || dest?.connectionStatus === "ready";
                  return (
                    <li key={p}>
                      {label} — {connected ? "Connected" : "Needs authentication"}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 font-body text-xs text-white/50">Configure authentication for each destination below.</p>
            </div>
          ) : null}

          {step === "authenticate" ? (
            <div className="space-y-4">
              {isOAuthPlatform ? (
                <>
                  {isConnected ? (
                    <div className="rounded-lg border border-[#53fc18]/30 bg-[#53fc18]/10 p-4">
                      <p className="flex items-center gap-2 font-body text-sm text-[#53fc18]">
                        <Check className="h-4 w-4" /> Connected
                      </p>
                      <p className="mt-2 font-body text-sm text-white">{activeDestination?.accountName}</p>
                      {activeDestination?.channelName ? (
                        <p className="font-body text-xs text-white/60">{activeDestination.channelName}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={() => void startOAuth()} className={TS.btnOutline}>
                          Change Account
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (!destinationId) return;
                            setBusy(true);
                            try {
                              await disconnectStreamingApi(destinationId);
                              await onSaved();
                              onToast("success", "Disconnected.");
                            } catch (err) {
                              onToast("error", err instanceof Error ? err.message : "Disconnect failed.");
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className={TS.btnOutline}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-body text-sm text-white/70">
                        Sign in with {platformLabel(platform)}. Stream keys are managed automatically — no manual entry required.
                      </p>
                      {devMessage ? <p className="font-body text-xs text-amber-200/90">{devMessage}</p> : null}
                      <button type="button" disabled={busy} onClick={() => void startOAuth()} className={TS.btnPrimary}>
                        Connect {platformLabel(platform)}
                      </button>
                    </>
                  )}
                </>
              ) : null}
              {normalizedPlatform === "church_website" ? (
                <ChurchWebsiteForm value={churchWebsite} onChange={setChurchWebsite} disabled={busy} />
              ) : null}
              {normalizedPlatform === "custom_rtmp" ? (
                <CustomRtmpForm value={customRtmp} onChange={setCustomRtmp} disabled={busy} />
              ) : null}
            </div>
          ) : null}

          {step === "stream-info" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Title</span>
                <input value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} className={`${TS.input} mt-1`} />
              </label>
              <label className="block md:col-span-2">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Description</span>
                <textarea value={streamDescription} onChange={(e) => setStreamDescription(e.target.value)} rows={3} className={`${TS.input} mt-1`} />
              </label>
              <label className="block">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Category</span>
                <input value={streamCategory} onChange={(e) => setStreamCategory(e.target.value)} className={`${TS.input} mt-1`} />
              </label>
              <label className="block">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Privacy</span>
                <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} className={`${TS.input} mt-1`}>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Thumbnail URL</span>
                <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." className={`${TS.input} mt-1`} />
              </label>
              <label className="block">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Scheduled Start</span>
                <input
                  type="datetime-local"
                  value={scheduledStartAt}
                  onChange={(e) => setScheduledStartAt(e.target.value)}
                  className={`${TS.input} mt-1`}
                />
              </label>
              <label className="block">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Tags</span>
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={`${TS.input} mt-1`} />
              </label>
            </div>
          ) : null}

          {step === "video" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <fieldset>
                <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Resolution</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["720p", "1080p", "1440p", "4k"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setVideoProfile((v) => ({ ...v, resolution: r }))} className={videoProfile.resolution === r ? TS.btnPrimary : TS.btnOutline}>{r}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">FPS</legend>
                <div className="mt-2 flex gap-2">
                  {([30, 60] as const).map((fps) => (
                    <button key={fps} type="button" onClick={() => setVideoProfile((v) => ({ ...v, fps }))} className={videoProfile.fps === fps ? TS.btnPrimary : TS.btnOutline}>{fps}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Codec</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setVideoProfile((v) => ({ ...v, codec: "h264" }))} className={videoProfile.codec === "h264" ? TS.btnPrimary : TS.btnOutline}>H264</button>
                  <button type="button" onClick={() => setVideoProfile((v) => ({ ...v, codec: "h265" }))} className={videoProfile.codec === "h265" ? TS.btnPrimary : TS.btnOutline}>H265</button>
                  <button type="button" disabled={!av1Supported} onClick={() => setVideoProfile((v) => ({ ...v, codec: "av1" }))} className={videoProfile.codec === "av1" ? TS.btnPrimary : TS.btnOutline}>AV1</button>
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Encoder</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["nvenc", "quicksync", "amf", "x264"] as const).map((enc) => (
                    <button key={enc} type="button" disabled={!detectedEncoders.includes(enc)} onClick={() => setEncoder(enc)} className={encoder === enc ? TS.btnPrimary : TS.btnOutline}>{enc.toUpperCase()}</button>
                  ))}
                </div>
                {gpuName ? <p className="mt-2 font-body text-xs text-white/55">GPU: {gpuName}</p> : null}
              </fieldset>
              <label className="block md:col-span-2">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Bitrate ({videoProfile.bitrateKbps} kbps)</span>
                <input type="range" min={1500} max={15000} step={100} value={videoProfile.bitrateKbps} onChange={(e) => setVideoProfile((v) => ({ ...v, bitrateKbps: Number(e.target.value) }))} className="mt-2 w-full" />
              </label>
              <label className="block">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Keyframe interval (sec)</span>
                <input type="number" min={1} max={10} value={videoProfile.keyframeIntervalSec} onChange={(e) => setVideoProfile((v) => ({ ...v, keyframeIntervalSec: Number(e.target.value) }))} className={`${TS.input} mt-1`} />
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 font-body text-sm text-white/75">
                  <input type="checkbox" checked={videoProfile.adaptiveBitrate} onChange={(e) => setVideoProfile((v) => ({ ...v, adaptiveBitrate: e.target.checked }))} />
                  Adaptive bitrate
                </label>
                <label className="flex items-center gap-2 font-body text-sm text-white/75">
                  <input type="checkbox" checked={videoProfile.hdr} onChange={(e) => setVideoProfile((v) => ({ ...v, hdr: e.target.checked }))} />
                  HDR
                </label>
              </div>
            </div>
          ) : null}

          {step === "audio" ? (
            <div className="space-y-4">
              <label className="block">
                <span className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Audio source</span>
                <select
                  value={audioProfile.source}
                  onChange={(e) => {
                    const item = [...mixerOptions, ...micOptions].find((s) => s.id === e.target.value);
                    setSelectedSoundItemId(e.target.value);
                    setAudioProfile((a) => ({
                      ...a,
                      source: item?.name ?? e.target.value,
                      sourceType: item?.category === "mixer" ? "mixer" : "microphone",
                    }));
                  }}
                  className={`${TS.input} mt-1`}
                >
                  <option value="">Select a source…</option>
                  {mixerOptions.length ? <optgroup label="Detected mixer">{mixerOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup> : null}
                  {micOptions.length ? <optgroup label="Detected microphones">{micOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup> : null}
                </select>
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <fieldset>
                  <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Sample rate</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {([44100, 48000, 96000] as const).map((sr) => (
                      <button key={sr} type="button" onClick={() => setAudioProfile((a) => ({ ...a, sampleRate: sr }))} className={audioProfile.sampleRate === sr ? TS.btnPrimary : TS.btnOutline}>{sr / 1000}k</button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Channels</legend>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setAudioProfile((a) => ({ ...a, channels: "stereo" }))} className={audioProfile.channels === "stereo" ? TS.btnPrimary : TS.btnOutline}>Stereo</button>
                    <button type="button" onClick={() => setAudioProfile((a) => ({ ...a, channels: "mono" }))} className={audioProfile.channels === "mono" ? TS.btnPrimary : TS.btnOutline}>Mono</button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Bitrate</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {([128, 192, 256, 320] as const).map((br) => (
                      <button key={br} type="button" onClick={() => setAudioProfile((a) => ({ ...a, bitrateKbps: br }))} className={audioProfile.bitrateKbps === br ? TS.btnPrimary : TS.btnOutline}>{br}</button>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div>
                <p className="font-ui text-[0.55rem] uppercase tracking-wider text-white/50">Live VU meters</p>
                <SoundDeviceMeter levels={liveLevels} className="mt-2" />
              </div>
            </div>
          ) : null}

          {step === "network" ? (
            <div className="space-y-4">
              <p className="font-body text-sm text-white/65">Measure upload, download, latency, and jitter from this production computer.</p>
              <button type="button" disabled={networkRunning} onClick={() => void runNetworkTest()} className={TS.btnBlue}>
                {networkRunning ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Testing…</> : "Run Connection Test"}
              </button>
              {networkTest ? (
                <dl className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-black/40 p-4 font-body text-sm md:grid-cols-3">
                  <div><dt className="text-white/50">Upload</dt><dd className="text-white">{networkTest.uploadMbps} Mbps</dd></div>
                  <div><dt className="text-white/50">Download</dt><dd className="text-white">{networkTest.downloadMbps} Mbps</dd></div>
                  <div><dt className="text-white/50">Latency</dt><dd className="text-white">{networkTest.latencyMs} ms</dd></div>
                  <div><dt className="text-white/50">Packet loss</dt><dd className="text-white">{networkTest.packetLossPercent}%</dd></div>
                  <div><dt className="text-white/50">Jitter</dt><dd className="text-white">{networkTest.jitterMs} ms</dd></div>
                  <div><dt className="text-white/50">Recommended bitrate</dt><dd className="text-white">{networkTest.recommendedBitrateKbps} kbps</dd></div>
                  <div className="md:col-span-3">
                    <dt className="text-white/50">Quality</dt>
                    <dd className="font-semibold uppercase text-brand-blue">{connectionQualityLabel(networkTest.streamingQuality)}</dd>
                  </div>
                </dl>
              ) : null}
            </div>
          ) : null}

          {step === "destination-test" ? (
            <div className="space-y-4">
              <p className="font-body text-sm text-white/65">Validate OAuth token, live permissions, quota, and RTMP readiness with the streaming platform API.</p>
              <button type="button" disabled={testRunning} onClick={() => void runDestinationTest()} className={TS.btnBlue}>
                {testRunning ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Validating…</> : "Run Destination Test"}
              </button>
              <TestConnectionResult running={testRunning} result={testResult} />
            </div>
          ) : null}

          {step === "preview" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/60">
                <video ref={previewVideoRef} muted playsInline className="aspect-video w-full bg-black object-cover" />
                {!previewVideoReady ? <p className="p-3 font-body text-xs text-white/50">Camera preview unavailable. Encoder stats still load when configured.</p> : null}
              </div>
              <dl className="grid grid-cols-2 gap-2 font-body text-xs text-white/70">
                <div><dt>Dropped frames</dt><dd className="text-white">{previewStats?.droppedFrames ?? 0}</dd></div>
                <div><dt>Bitrate</dt><dd className="text-white">{previewStats?.currentBitrateKbps ?? videoProfile.bitrateKbps} kbps</dd></div>
                <div><dt>FPS</dt><dd className="text-white">{previewStats?.currentFps ?? videoProfile.fps}</dd></div>
                <div><dt>Encoder</dt><dd className="text-white">{previewStats?.encoderUsagePercent ?? 0}%</dd></div>
                <div><dt>GPU</dt><dd className="text-white">{previewStats?.gpuUsagePercent ?? 0}%</dd></div>
                <div><dt>CPU</dt><dd className="text-white">{previewStats?.cpuUsagePercent ?? 0}%</dd></div>
                <div><dt>Network</dt><dd className="text-white">{previewStats?.networkThroughputMbps ?? 0} Mbps</dd></div>
                <div className="col-span-2"><SoundDeviceMeter levels={liveLevels} /></div>
              </dl>
            </div>
          ) : null}

          {step === "save" ? (
            <div className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-4">
              <p className="font-body text-sm text-white">Review and save your streaming configuration for today&apos;s service.</p>
              <ul className="mt-4 space-y-2 font-body text-sm text-white/75">
                <li>Destination: {platformLabel(platform)}</li>
                <li>Account: {activeDestination?.accountName ?? "Configured"}</li>
                <li>Video: {formatVideoProfileLabel(videoProfile)} @ {videoProfile.bitrateKbps} kbps</li>
                <li>Audio: {audioProfile.bitrateKbps} kbps {audioProfile.channels}</li>
                <li>Network: {networkTest ? connectionQualityLabel(networkTest.streamingQuality) : "Not tested"}</li>
                <li>Validation: {testResult?.success ? "Ready to Stream" : "Run destination test first"}</li>
              </ul>
            </div>
          ) : null}
          </WizardErrorBoundary>
        </div>

        <div
          ref={footerRef}
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0C0C10]/95 px-5 py-4 backdrop-blur-sm"
        >
          <div className="flex gap-2">
            {wizardStepIndex(step) > 0 ? (
              <button type="button" disabled={busy} onClick={goBack} className={TS.btnOutline}>Back</button>
            ) : null}
            <button type="button" disabled={busy} onClick={() => { resetWizard(); onClose(); }} className={TS.btnOutline}>Cancel</button>
          </div>
          <div className="flex gap-2">
            {step === "save" ? (
              <button type="button" disabled={busy || !testResult?.success} onClick={() => void finishWizard()} className={TS.btnPrimary}>
                {busy ? "Saving…" : "Save & Mark Ready"}
              </button>
            ) : step !== "choose" ? (
              <button
                type="button"
                disabled={busy || continueDisabled}
                onClick={handleContinueClick}
                aria-busy={busy}
                className={`${TS.btnPrimary} touch-target ${busy || continueDisabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
                    Continuing…
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
