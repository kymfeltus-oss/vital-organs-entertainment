"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Loader2, MonitorPlay, RefreshCw } from "lucide-react";
import LiveHubNetworkSettingsModal from "@/components/live-hub/LiveHubNetworkSettingsModal";
import LiveHubGoLiveModal from "@/components/live-hub/LiveHubGoLiveModal";
import LiveHubGoLiveButton from "@/components/live-hub/LiveHubGoLiveButton";
import LiveHubDesktopGate from "@/components/live-hub/LiveHubDesktopGate";
import LiveHubPreviewPanel from "@/components/live-hub/LiveHubPreviewPanel";
import LiveHubSidebar from "@/components/live-hub/LiveHubSidebar";
import LiveHubChecklistHero from "@/components/live-hub/LiveHubChecklistHero";
import LiveHubReadinessPanel from "@/components/live-hub/LiveHubReadinessPanel";
import LiveHubChatPanel from "@/components/live-hub/LiveHubChatPanel";
import LiveHubEventTimelinePanel from "@/components/live-hub/LiveHubEventTimelinePanel";
import LiveHubLowerPanels from "@/components/live-hub/LiveHubLowerPanels";
import LiveHubAudioHealthLog from "@/components/live-hub/LiveHubAudioHealthLog";
import LiveHubStatusStrip from "@/components/live-hub/LiveHubStatusStrip";
import LiveHubStreamPanels from "@/components/live-hub/LiveHubStreamPanels";
import {
  useLiveHubDesktop,
  useLiveHubDesktopReady,
} from "@/components/live-hub/useLiveHubDesktop";
import type { HubNavSection } from "@/lib/live-hub/console-layout";
import {
  buildReadinessChecks,
  deriveChecklistPhases,
  measureUploadSpeedMbps,
} from "@/lib/live-hub/readiness";
import {
  createInitialNetworkTelemetry,
  formatInternetDetail,
  isNetworkOnline,
  probeNetworkTelemetry,
  subscribeNetworkInformation,
  type NetworkTelemetry,
} from "@/lib/live-hub/network";
import { evaluateGoLiveDecision } from "@/lib/live-hub/safety";
import { useLiveHubMixer } from "@/hooks/use-live-hub-mixer";
import { useLiveHubNetworkSettings } from "@/hooks/useLiveHubNetworkSettings";
import {
  fetchRestreamState,
  sendRestreamCommand,
} from "@/lib/live-hub/restream/client";
import type { RestreamState } from "@/lib/live-hub/restream/types";
import { isRestreamAdapterFailure } from "@/lib/live-hub/restream/types";
import {
  createTimelineEvent,
  prependTimelineEvent,
  type TimelineEvent,
} from "@/lib/live-hub/timeline";
import {
  DEFAULT_LIVE_HUB_SETTINGS,
  type ChecklistPhaseId,
  type ReadinessCheckId,
} from "@/lib/live-hub/types";
import { fetchVmixState } from "@/lib/live-hub/vmix/client";
import type { VmixAdapterResult, VmixCommandType, VmixState } from "@/lib/live-hub/vmix/types";
import { isVmixAdapterFailure } from "@/lib/live-hub/vmix/types";
import type { OpsSnapshot } from "@/lib/ops/types";
import { useLiveRoomChat } from "@/lib/useLiveRoomChat";

const POLL_INTERVAL_MS = 10_000;
const IS_DEV_SANDBOX = process.env.NODE_ENV === "development";
/** Dev-only Shift+click simulate value — held until a normal upload re-test clears override. */
const DEV_UPLOAD_SPEED_OVERRIDE_MBPS = 20;

type LiveHubConsoleProps = {
  adminEmail: string;
  initialSnapshot: OpsSnapshot;
};

export default function LiveHubConsole({
  adminEmail,
  initialSnapshot,
}: LiveHubConsoleProps) {
  const desktopReady = useLiveHubDesktopReady();
  const isDesktop = useLiveHubDesktop();
  const { masterVolumeLevel: localMicLevel, healingLogs, simulateAudioDrop } =
    useLiveHubMixer(IS_DEV_SANDBOX);
  const [networkSettings, patchNetworkSettings] = useLiveHubNetworkSettings();

  const [activeSection, setActiveSection] = useState<HubNavSection>("pre-live");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [vmixState, setVmixState] = useState<VmixState | null>(null);
  const [restreamState, setRestreamState] = useState<RestreamState | null>(null);
  const [vmixError, setVmixError] = useState<string | null>(null);
  const [restreamError, setRestreamError] = useState<string | null>(null);
  const [networkTelemetry, setNetworkTelemetry] = useState<NetworkTelemetry>(() =>
    createInitialNetworkTelemetry(),
  );
  const [stripeApiLive, setStripeApiLive] = useState<boolean | null>(null);
  const [uploadSpeedMbps, setUploadSpeedMbps] = useState<number | null>(() =>
    measureUploadSpeedMbps(),
  );
  /** Bumped on every upload re-test so UI refreshes even when Mbps value is unchanged. */
  const [uploadRecheckNonce, setUploadRecheckNonce] = useState(0);
  /** Dev-only: Shift+click simulate — polling must not overwrite until normal re-test. */
  const [uploadSpeedDevOverride, setUploadSpeedDevOverride] = useState(false);
  const [recheckingId, setRecheckingId] = useState<ReadinessCheckId | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [manualChecklist, setManualChecklist] = useState<
    Partial<Record<ChecklistPhaseId, boolean>>
  >({});
  const [hubSettings] = useState(DEFAULT_LIVE_HUB_SETTINGS);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [operatorApproved, setOperatorApproved] = useState(false);
  const [isGoLiveSubmitting, setIsGoLiveSubmitting] = useState(false);
  const [isStopSubmitting, setIsStopSubmitting] = useState(false);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [liveStartedAt, setLiveStartedAt] = useState<number | null>(() =>
    initialSnapshot.stream.isLive ? Date.now() : null,
  );
  const [pendingVmixAction, setPendingVmixAction] = useState<VmixCommandType | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: VmixCommandType;
    label: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewRefreshSignal, setPreviewRefreshSignal] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNetworkSettingsOpen, setIsNetworkSettingsOpen] = useState(false);
  const [isNetworkTesting, setIsNetworkTesting] = useState(false);

  const {
    messages: chatMessages,
    isLoading: isChatLoading,
    error: chatError,
  } = useLiveRoomChat();

  const pushTimeline = useCallback(
    (
      category: TimelineEvent["category"],
      title: string,
      detail: string,
    ) => {
      setTimeline((current) =>
        prependTimelineEvent(current, createTimelineEvent(category, title, detail)),
      );
    },
    [],
  );

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/api/ops/metrics", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return;
    const next = (await response.json()) as OpsSnapshot;
    setSnapshot(next);
  }, []);

  const refreshVmix = useCallback(async (): Promise<boolean> => {
    const result = await fetchVmixState();
    if (isVmixAdapterFailure(result)) {
      setVmixError(result.error);
      setVmixState(null);
      return false;
    }
    setVmixState(result.state);
    setVmixError(null);
    return true;
  }, []);

  const refreshRestream = useCallback(async () => {
    const result = await fetchRestreamState();
    if (isRestreamAdapterFailure(result)) {
      setRestreamError(result.error);
      pushTimeline("restream", "Restream Refresh Failed", result.error);
      return;
    }
    setRestreamState(result.state);
    setRestreamError(null);
  }, [pushTimeline]);

  const refreshNetworkProbe = useCallback(async (): Promise<NetworkTelemetry> => {
    const next = await probeNetworkTelemetry();
    setNetworkTelemetry(next);
    return next;
  }, []);

  const refreshStripeHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live-hub/stripe", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        setStripeApiLive(false);
        return;
      }
      const payload = (await response.json()) as { live?: boolean };
      setStripeApiLive(payload.live === true);
    } catch {
      setStripeApiLive(false);
    }
  }, []);

  const refreshUploadSpeed = useCallback(() => {
    if (uploadSpeedDevOverride) return;
    setUploadSpeedMbps(measureUploadSpeedMbps());
    setUploadRecheckNonce((current) => current + 1);
  }, [uploadSpeedDevOverride]);

  const refreshAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      refreshUploadSpeed();
      await Promise.all([
        refreshNetworkProbe(),
        refreshSnapshot(),
        refreshVmix(),
        refreshRestream(),
        refreshStripeHealth(),
      ]);
      setPreviewRefreshSignal((current) => current + 1);
      setActionMessage(
        uploadSpeedDevOverride
          ? `Systems synced at ${new Date().toLocaleTimeString()} — upload dev override held at ${DEV_UPLOAD_SPEED_OVERRIDE_MBPS.toFixed(1)} Mbps.`
          : `Systems synced at ${new Date().toLocaleTimeString()} — metrics, vMix, Restream, Stripe, and upload estimate refreshed.`,
      );
    } finally {
      setIsSyncing(false);
    }
  }, [
    refreshNetworkProbe,
    refreshRestream,
    refreshSnapshot,
    refreshStripeHealth,
    refreshUploadSpeed,
    refreshVmix,
    uploadSpeedDevOverride,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    const intervalId = window.setInterval(() => {
      void refreshAll();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [refreshAll]);

  useEffect(() => {
    const handleConnectivityChange = () => {
      void refreshNetworkProbe();
    };

    void refreshNetworkProbe();
    window.addEventListener("online", handleConnectivityChange);
    window.addEventListener("offline", handleConnectivityChange);
    const unsubscribeLink = subscribeNetworkInformation(handleConnectivityChange);

    return () => {
      window.removeEventListener("online", handleConnectivityChange);
      window.removeEventListener("offline", handleConnectivityChange);
      unsubscribeLink();
    };
  }, [refreshNetworkProbe]);

  useEffect(() => {
    const intervalMs = networkSettings.probeIntervalSec * 1000;
    const intervalId = window.setInterval(() => {
      void refreshNetworkProbe();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [networkSettings.probeIntervalSec, refreshNetworkProbe]);

  const networkOnline = useMemo(
    () =>
      isNetworkOnline(networkTelemetry, {
        requireServerProbe: networkSettings.requireServerProbe,
      }),
    [networkSettings.requireServerProbe, networkTelemetry],
  );

  const runNetworkTest = useCallback(async () => {
    setIsNetworkTesting(true);
    try {
      const next = await refreshNetworkProbe();
      const detail = formatInternetDetail(next);
      pushTimeline("readiness", "Network Test", detail);
      setActionMessage(`Network test complete — ${detail}`);
    } finally {
      setIsNetworkTesting(false);
    }
  }, [pushTimeline, refreshNetworkProbe]);

  const readinessInputs = useMemo(
    () => ({
      vmix: vmixState,
      restream: restreamState,
      opsSnapshot: snapshot,
      networkTelemetry,
      networkSettings,
      uploadSpeedMbps,
      uploadRecheckNonce,
      uploadSpeedDevOverride,
    }),
    [
      networkTelemetry,
      networkSettings,
      restreamState,
      snapshot,
      uploadRecheckNonce,
      uploadSpeedDevOverride,
      uploadSpeedMbps,
      vmixState,
    ],
  );

  const readinessChecks = useMemo(
    () => buildReadinessChecks(readinessInputs),
    [readinessInputs],
  );

  const checklistPhases = useMemo(
    () => deriveChecklistPhases(readinessChecks, manualChecklist),
    [manualChecklist, readinessChecks],
  );

  const checklistCompleteCount = useMemo(
    () => checklistPhases.filter((phase) => phase.complete).length,
    [checklistPhases],
  );

  const goLiveDecision = useMemo(
    () =>
      evaluateGoLiveDecision({
        vmix: vmixState,
        restream: restreamState,
        opsSnapshot: snapshot,
        checks: readinessChecks,
        settings: hubSettings,
        networkOnline,
        operatorApproved,
        stripeApiLive,
        contentReady: manualChecklist.content ?? false,
        teamAligned: manualChecklist.team ?? false,
        localMicLevel,
      }),
    [
      hubSettings,
      localMicLevel,
      manualChecklist.content,
      manualChecklist.team,
      networkOnline,
      operatorApproved,
      readinessChecks,
      restreamState,
      snapshot,
      stripeApiLive,
      vmixState,
    ],
  );

  const onlineCount = useMemo(
    () =>
      Math.max(
        snapshot.metrics.paidAttendees,
        chatMessages.length,
        snapshot.realtime.recentChatMessages10m,
      ),
    [
      chatMessages.length,
      snapshot.metrics.paidAttendees,
      snapshot.realtime.recentChatMessages10m,
    ],
  );

  const runVmixAction = useCallback(
    async (
      type: VmixCommandType,
      options?: { confirmed?: boolean; readinessReviewed?: boolean },
    ) => {
      setPendingVmixAction(type);
      setActionMessage(null);

      const response = await fetch("/api/ops/live-hub/vmix", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: { type },
          confirmed: options?.confirmed ?? false,
          readinessReviewed: options?.readinessReviewed ?? false,
        }),
        cache: "no-store",
      });

      const result = (await response.json()) as VmixAdapterResult;

      if (isVmixAdapterFailure(result)) {
        if (result.code === "CONFIRMATION_REQUIRED") {
          setConfirmAction({
            type,
            label: type.replaceAll("_", " "),
          });
          setPendingVmixAction(null);
          return;
        }
        if (result.code === "READINESS_REQUIRED") {
          setActionMessage(result.error);
          pushTimeline("blocked", "Readiness Required", result.error);
          setPendingVmixAction(null);
          return;
        }
        setActionMessage(result.error);
        pushTimeline("vmix", "vMix Command Failed", result.error);
        setPendingVmixAction(null);
        return;
      }

      setVmixState(result.state);
      setVmixError(null);
      pushTimeline("vmix", "vMix Command", `${type} executed.`);
      setPendingVmixAction(null);
    },
    [pushTimeline],
  );

  const handleConfirmDangerousVmix = useCallback(async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    pushTimeline("confirmation", "Dangerous Action Approved", action.label);
    await runVmixAction(action.type, { confirmed: true });
  }, [confirmAction, pushTimeline, runVmixAction]);

  useEffect(() => {
    if (snapshot.stream.isLive && liveStartedAt === null) {
      setLiveStartedAt(Date.now());
      return;
    }
    if (!snapshot.stream.isLive && liveStartedAt !== null) {
      setLiveStartedAt(null);
    }
  }, [liveStartedAt, snapshot.stream.isLive]);

  const handleGoLiveConfirm = useCallback(async () => {
    if (goLiveDecision.blocked || !operatorApproved) {
      pushTimeline("blocked", "Go Live Blocked", "Critical issues unresolved.");
      return;
    }

    setIsGoLiveSubmitting(true);
    pushTimeline("go_live", "Go Live Attempt", `Operator ${adminEmail} initiated.`);

    try {
      const response = await fetch("/api/ops/live-hub/go-live", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "go_live" }),
        cache: "no-store",
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        step?: string;
      };

      if (!response.ok || !data.ok) {
        const stepLabel = data.step ? ` (${data.step})` : "";
        throw new Error(data.error ?? `Go Live failed${stepLabel}.`);
      }

      setLiveStartedAt(Date.now());
      setActiveSection("stream-setup");
      pushTimeline(
        "go_live",
        "Broadcast Live",
        "Restream lanes armed, vMix streaming started, attendee platform opened.",
      );
      setActionMessage("Platform is live on primary lane.");
      setIsGoLiveOpen(false);
      setOperatorApproved(false);
      await Promise.all([refreshSnapshot(), refreshVmix(), refreshRestream()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Go Live failed.";
      pushTimeline("blocked", "Go Live Failed", message);
      setActionMessage(message);
    } finally {
      setIsGoLiveSubmitting(false);
    }
  }, [
    adminEmail,
    goLiveDecision.blocked,
    operatorApproved,
    pushTimeline,
    refreshRestream,
    refreshSnapshot,
    refreshVmix,
  ]);

  const openStopConfirm = useCallback(() => {
    pushTimeline(
      "go_live",
      "Stop Stream Requested",
      `Operator ${adminEmail} opened end-broadcast confirmation.`,
    );
    setIsStopConfirmOpen(true);
  }, [adminEmail, pushTimeline]);

  const handleStopStream = useCallback(async () => {
    setIsStopConfirmOpen(false);
    setIsStopSubmitting(true);
    pushTimeline("go_live", "Stop Stream", `Operator ${adminEmail} confirmed end broadcast.`);

    try {
      const response = await fetch("/api/ops/live-hub/go-live", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop_stream" }),
        cache: "no-store",
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        step?: string;
      };

      if (!response.ok || !data.ok) {
        const stepLabel = data.step ? ` (${data.step})` : "";
        throw new Error(data.error ?? `Stop stream failed${stepLabel}.`);
      }

      setLiveStartedAt(null);
      setActiveSection("pre-live");
      pushTimeline(
        "go_live",
        "Broadcast Ended",
        "vMix streaming stopped and attendee platform closed.",
      );
      setActionMessage("Stream stopped — post-event summary ready in Pre-Live Check.");
      await Promise.all([refreshSnapshot(), refreshVmix(), refreshRestream()]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stop stream failed.";
      pushTimeline("blocked", "Stop Stream Failed", message);
      setActionMessage(message);
    } finally {
      setIsStopSubmitting(false);
    }
  }, [
    adminEmail,
    pushTimeline,
    refreshRestream,
    refreshSnapshot,
    refreshVmix,
  ]);

  const toggleManualPhase = (phaseId: ChecklistPhaseId) => {
    setManualChecklist((current) => {
      const next = !current[phaseId];
      pushTimeline(
        "readiness",
        "Checklist Updated",
        `${phaseId} marked ${next ? "complete" : "incomplete"}.`,
      );
      return { ...current, [phaseId]: next };
    });
  };

  const recheckReadinessCheck = useCallback(
    async (
      checkId: ReadinessCheckId,
      options?: { devSimulatePass?: boolean },
    ) => {
      if (checkId !== "internet" && checkId !== "upload_speed" && checkId !== "encoder_vmix") {
        return;
      }

      setRecheckingId(checkId);
      try {
        if (checkId === "internet") {
          const next = await refreshNetworkProbe();
          const detail = formatInternetDetail(next);
          const connected = isNetworkOnline(next, {
            requireServerProbe: networkSettings.requireServerProbe,
          });
          setActionMessage(
            connected
              ? `Internet connection verified — ${detail}`
              : `Internet connection blocked — ${detail}`,
          );
          pushTimeline("readiness", "Internet Connection Rechecked", detail);
          return;
        }

        if (checkId === "encoder_vmix") {
          const connected = await refreshVmix();
          if (connected) {
            setActionMessage("Encoder re-check passed — Encoder & Software is ready.");
            pushTimeline("vmix", "Encoder Re-check", "vMix reachable — encoder ready.");
          } else {
            setActionMessage("Encoder re-check failed — Encoder & Software is blocked.");
            pushTimeline(
              "vmix",
              "Encoder Re-check",
              `Blocked — vMix unreachable or invalid response.`,
            );
          }
          return;
        }

        if (IS_DEV_SANDBOX && options?.devSimulatePass) {
          setUploadSpeedDevOverride(true);
          setUploadSpeedMbps(DEV_UPLOAD_SPEED_OVERRIDE_MBPS);
          setUploadRecheckNonce((current) => current + 1);
          setActionMessage(
            `Upload speed dev override locked at ${DEV_UPLOAD_SPEED_OVERRIDE_MBPS.toFixed(1)} Mbps — background sync will not revert it. Normal click clears override.`,
          );
          pushTimeline(
            "readiness",
            "Upload Speed Simulated (Dev)",
            `${DEV_UPLOAD_SPEED_OVERRIDE_MBPS.toFixed(1)} Mbps — override active until normal re-test`,
          );
          return;
        }

        setUploadSpeedDevOverride(false);
        const next = measureUploadSpeedMbps();
        setUploadSpeedMbps(next);
        setUploadRecheckNonce((current) => current + 1);
        const detail = next
          ? `${next.toFixed(1)} Mbps estimated upload`
          : "Network Information API unavailable";
        setActionMessage(`Upload speed re-tested: ${detail}. Dev override cleared.`);
        pushTimeline("readiness", "Upload Speed Rechecked", detail);
      } finally {
        setRecheckingId(null);
      }
    },
    [networkSettings.requireServerProbe, pushTimeline, refreshNetworkProbe, refreshVmix],
  );

  const openGoLiveModal = () => {
    setOperatorApproved(false);
    setIsGoLiveOpen(true);
    pushTimeline("go_live", "Review Opened", "Go Live review modal opened.");
  };

  const togglePreview = () => {
    setIsPreviewVisible((current) => {
      const next = !current;
      pushTimeline(
        "readiness",
        next ? "Preview Opened" : "Preview Hidden",
        "Viewer signal monitor toggled.",
      );
      return next;
    });
  };

  const openPreviewForTest = () => {
    setIsPreviewVisible(true);
    void refreshAll();
    pushTimeline("readiness", "Stream Test", "Preview opened and systems synced.");
  };

  if (!desktopReady) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0B090A]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1E40AF]" />
      </main>
    );
  }

  if (!isDesktop) {
    return <LiveHubDesktopGate />;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#0B090A] text-white">
      <LiveHubSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-[#0B090A] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 shrink">
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[#1E40AF]">
              300 Awakening
            </p>
            <h1 className="text-lg font-bold uppercase tracking-widest text-white">
              Live Experience
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {snapshot.stream.isLive
                ? `Broadcast live · Operator ${adminEmail}`
                : `You are 1 step away from going live · Operator ${adminEmail}`}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-300 transition enabled:hover:border-[#1E40AF]/50 enabled:hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {isSyncing ? "Syncing…" : "Sync All"}
            </button>
            <button
              type="button"
              onClick={togglePreview}
              aria-pressed={isPreviewVisible}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] transition ${
                isPreviewVisible
                  ? "border-brand-blue/50 bg-brand-blue/10 text-white"
                  : "border-white/15 text-zinc-300 hover:border-brand-blue/50 hover:text-white"
              }`}
            >
              <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
              {isPreviewVisible ? "Hide Preview" : "Live Preview"}
            </button>
            <LiveHubGoLiveButton
              blocked={goLiveDecision.blocked}
              criticalIssueCount={goLiveDecision.criticalIssues.length}
              onClick={openGoLiveModal}
              isLive={snapshot.stream.isLive}
              onStop={openStopConfirm}
              isStopping={isStopSubmitting}
              variant="header"
            />
          </div>
        </header>

        {actionMessage ? (
          <p className="mx-6 mt-3 rounded-xl border border-[#1E40AF]/30 bg-[#1E40AF]/10 px-4 py-2 text-xs text-zinc-200">
            {actionMessage}
          </p>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-4 overflow-hidden p-4">
          <div className="col-span-8 flex min-h-0 flex-col gap-4 overflow-auto pr-1">
            {activeSection === "pre-live" ? (
              <>
                <LiveHubChecklistHero
                  phases={checklistPhases}
                  onTogglePhase={toggleManualPhase}
                  goLiveBlocked={goLiveDecision.blocked}
                  criticalIssueCount={goLiveDecision.criticalIssues.length}
                  onGoLive={openGoLiveModal}
                  isLive={snapshot.stream.isLive}
                  onStop={openStopConfirm}
                  isStopping={isStopSubmitting}
                />
                <LiveHubReadinessPanel
                  checks={readinessChecks}
                  onRecheckCheck={(checkId, options) =>
                    void recheckReadinessCheck(checkId, options)
                  }
                  onOpenNetworkSettings={() => setIsNetworkSettingsOpen(true)}
                  recheckingId={recheckingId}
                  devSimulateHint={IS_DEV_SANDBOX}
                  isSyncing={isSyncing}
                  uploadSpeedDevOverride={uploadSpeedDevOverride}
                />
                <LiveHubAudioHealthLog
                  healingLogs={healingLogs}
                  onSimulateSilence={IS_DEV_SANDBOX ? simulateAudioDrop : undefined}
                />
                <LiveHubLowerPanels
                  goLiveDecision={goLiveDecision}
                  backupConfigured={snapshot.stream.backupConfigured}
                  onRunRehearsal={() => void runVmixAction("refresh_state")}
                  onTestStream={openPreviewForTest}
                  onShareStream={() => {
                    const url = `${window.location.origin}/dashboard/live`;
                    void navigator.clipboard?.writeText(url);
                    pushTimeline("readiness", "Share Link Copied", url);
                  }}
                />
                <div className="sticky bottom-0 z-20 -mx-1 border-t border-brand-border bg-brand-black/95 px-1 py-3 backdrop-blur-sm">
                  <LiveHubGoLiveButton
                    blocked={goLiveDecision.blocked}
                    criticalIssueCount={goLiveDecision.criticalIssues.length}
                    onClick={openGoLiveModal}
                    isLive={snapshot.stream.isLive}
                    onStop={openStopConfirm}
                    isStopping={isStopSubmitting}
                    variant="sticky"
                  />
                  <p className="mt-2 text-center text-[0.5rem] uppercase tracking-[0.12em] text-brand-muted">
                    {snapshot.stream.isLive
                      ? "Broadcast on air — stop stream when the event concludes"
                      : goLiveDecision.blocked
                        ? "Resolve blockers in the review modal before broadcast"
                        : "All critical checks passing — open review to confirm"}
                  </p>
                </div>
              </>
            ) : (
              <LiveHubStreamPanels
                section={activeSection}
                snapshot={snapshot}
                vmixState={vmixState}
                vmixError={vmixError}
                restreamState={restreamState}
                restreamError={restreamError}
                pendingVmixAction={pendingVmixAction}
                checklistPhases={checklistPhases}
                networkSettings={networkSettings}
                onNetworkSettingsChange={patchNetworkSettings}
                networkTelemetry={networkTelemetry}
                networkOnline={networkOnline}
                onNetworkTest={runNetworkTest}
                isNetworkTesting={isNetworkTesting}
                onVmixAction={(type, options) => void runVmixAction(type, options)}
                onRestreamRefresh={() => {
                  void sendRestreamCommand({ type: "refresh_status" }).then((result) => {
                    if (result.ok) {
                      setRestreamState(result.state);
                      pushTimeline("restream", "Restream Refreshed", "Status synced.");
                    }
                  });
                }}
                onRestreamSyncMetadata={() => {
                  void sendRestreamCommand({ type: "sync_metadata" }).then((result) => {
                    if (result.ok) {
                      setRestreamState(result.state);
                      pushTimeline("restream", "Metadata Sync", "Event metadata placeholder.");
                    }
                  });
                }}
              />
            )}
          </div>

          <aside className="col-span-4 flex min-h-0 flex-col gap-4 overflow-auto">
            <div
              className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                isPreviewVisible
                  ? "max-h-[min(52vh,520px)] opacity-100"
                  : "max-h-0 opacity-0 pointer-events-none"
              }`}
              aria-hidden={!isPreviewVisible}
            >
              <LiveHubPreviewPanel
                refreshSignal={previewRefreshSignal}
                vmixState={vmixState}
                vmixError={vmixError}
              />
            </div>
            <LiveHubChatPanel
              messages={chatMessages}
              isLoading={isChatLoading}
              error={chatError}
              onlineCount={onlineCount}
            />
            <LiveHubEventTimelinePanel
              isLive={snapshot.stream.isLive}
              checklistCompleteCount={checklistCompleteCount}
              events={timeline}
            />
          </aside>
        </div>

        <LiveHubStatusStrip
          networkOnline={networkOnline}
          networkDetail={
            networkTelemetry.lastProbedAt
              ? formatInternetDetail(networkTelemetry)
              : null
          }
          isLive={snapshot.stream.isLive}
          liveStartedAt={liveStartedAt}
        />
      </div>

      <LiveHubGoLiveModal
        isOpen={isGoLiveOpen}
        isSubmitting={isGoLiveSubmitting}
        decision={goLiveDecision}
        checks={readinessChecks}
        vmix={vmixState}
        restream={restreamState}
        snapshot={snapshot}
        operatorApproved={operatorApproved}
        onOperatorApprovedChange={setOperatorApproved}
        onClose={() => setIsGoLiveOpen(false)}
        onConfirm={() => void handleGoLiveConfirm()}
      />

      <LiveHubNetworkSettingsModal
        open={isNetworkSettingsOpen}
        onClose={() => setIsNetworkSettingsOpen(false)}
        settings={networkSettings}
        onChange={patchNetworkSettings}
        telemetry={networkTelemetry}
        networkOnline={networkOnline}
        onTestConnection={runNetworkTest}
        isTesting={isNetworkTesting}
      />

      {isStopConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/85 p-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stop-stream-modal-title"
            className="w-full max-w-md rounded-2xl border border-brand-pink/40 bg-brand-panel p-5"
          >
            <h3
              id="stop-stream-modal-title"
              className="font-headline text-sm uppercase tracking-widest text-white"
            >
              End Broadcast?
            </h3>
            <p className="mt-3 text-sm text-brand-muted">
              This stops vMix streaming and closes the attendee live experience. Confirm
              only when the event is finished.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStopConfirmOpen(false)}
                disabled={isStopSubmitting}
                className="touch-target rounded-full border border-brand-border px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-zinc-300 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleStopStream()}
                disabled={isStopSubmitting}
                className="touch-target rounded-full border border-brand-pink/60 bg-brand-pink/15 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white neon-pink-glow disabled:opacity-50"
              >
                {isStopSubmitting ? "Stopping…" : "Confirm Stop"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B090A]/85 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#B0267A]/40 bg-[#111111] p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              Confirm {confirmAction.label}
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              This action affects the live production. Confirm only if intentional.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-full border border-white/15 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDangerousVmix()}
                className="rounded-full border border-[#B0267A]/60 bg-[#B0267A]/15 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#f5c2e0]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
