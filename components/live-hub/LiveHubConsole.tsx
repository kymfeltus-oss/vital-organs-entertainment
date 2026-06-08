"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, MonitorPlay, RefreshCw } from "lucide-react";
import LiveHubGoLiveModal from "@/components/live-hub/LiveHubGoLiveModal";
import LiveHubDesktopGate from "@/components/live-hub/LiveHubDesktopGate";
import LiveHubPreviewPanel from "@/components/live-hub/LiveHubPreviewPanel";
import LiveHubSidebar from "@/components/live-hub/LiveHubSidebar";
import LiveHubChecklistHero from "@/components/live-hub/LiveHubChecklistHero";
import LiveHubReadinessPanel from "@/components/live-hub/LiveHubReadinessPanel";
import LiveHubChatPanel from "@/components/live-hub/LiveHubChatPanel";
import LiveHubEventTimelinePanel from "@/components/live-hub/LiveHubEventTimelinePanel";
import LiveHubLowerPanels from "@/components/live-hub/LiveHubLowerPanels";
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
  estimateUploadSpeedMbps,
} from "@/lib/live-hub/readiness";
import { evaluateGoLiveDecision } from "@/lib/live-hub/safety";
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
} from "@/lib/live-hub/types";
import { fetchVmixState } from "@/lib/live-hub/vmix/client";
import type { VmixAdapterResult, VmixCommandType, VmixState } from "@/lib/live-hub/vmix/types";
import { isVmixAdapterFailure } from "@/lib/live-hub/vmix/types";
import type { OpsSnapshot } from "@/lib/ops/types";
import { useLiveRoomChat } from "@/lib/useLiveRoomChat";

const POLL_INTERVAL_MS = 10_000;

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
  const previewRef = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSection] = useState<HubNavSection>("pre-live");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [vmixState, setVmixState] = useState<VmixState | null>(null);
  const [restreamState, setRestreamState] = useState<RestreamState | null>(null);
  const [vmixError, setVmixError] = useState<string | null>(null);
  const [restreamError, setRestreamError] = useState<string | null>(null);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [uploadSpeedMbps] = useState<number | null>(() => estimateUploadSpeedMbps());
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [manualChecklist, setManualChecklist] = useState<
    Partial<Record<ChecklistPhaseId, boolean>>
  >({});
  const [hubSettings] = useState(DEFAULT_LIVE_HUB_SETTINGS);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [operatorApproved, setOperatorApproved] = useState(false);
  const [isGoLiveSubmitting, setIsGoLiveSubmitting] = useState(false);
  const [pendingVmixAction, setPendingVmixAction] = useState<VmixCommandType | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: VmixCommandType;
    label: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewRefreshSignal, setPreviewRefreshSignal] = useState(0);

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

  const refreshVmix = useCallback(async () => {
    const result = await fetchVmixState();
    if (isVmixAdapterFailure(result)) {
      setVmixError(result.error);
      pushTimeline("vmix", "vMix Refresh Failed", result.error);
      return;
    }
    setVmixState(result.state);
    setVmixError(null);
  }, [pushTimeline]);

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

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshSnapshot(), refreshVmix(), refreshRestream()]);
    setPreviewRefreshSignal((current) => current + 1);
  }, [refreshRestream, refreshSnapshot, refreshVmix]);

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
    const syncNetwork = () => setNetworkOnline(navigator.onLine);
    syncNetwork();
    window.addEventListener("online", syncNetwork);
    window.addEventListener("offline", syncNetwork);
    return () => {
      window.removeEventListener("online", syncNetwork);
      window.removeEventListener("offline", syncNetwork);
    };
  }, []);

  const readinessInputs = useMemo(
    () => ({
      vmix: vmixState,
      restream: restreamState,
      opsSnapshot: snapshot,
      networkOnline,
      uploadSpeedMbps,
    }),
    [networkOnline, restreamState, snapshot, uploadSpeedMbps, vmixState],
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
      }),
    [
      hubSettings,
      networkOnline,
      operatorApproved,
      readinessChecks,
      restreamState,
      snapshot,
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

  const handleGoLiveConfirm = useCallback(async () => {
    if (goLiveDecision.blocked || !operatorApproved) {
      pushTimeline("blocked", "Go Live Blocked", "Critical issues unresolved.");
      return;
    }

    setIsGoLiveSubmitting(true);
    pushTimeline("go_live", "Go Live Attempt", `Operator ${adminEmail} initiated.`);

    try {
      const response = await fetch("/api/ops/stream-action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "go_live" }),
        cache: "no-store",
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Go Live failed.");
      }

      pushTimeline("go_live", "Platform Live", "Attendee experience opened.");
      setActionMessage("Platform is live on primary lane.");
      setIsGoLiveOpen(false);
      setOperatorApproved(false);
      await refreshSnapshot();
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
    refreshSnapshot,
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

  const openGoLiveModal = () => {
    setOperatorApproved(false);
    setIsGoLiveOpen(true);
    pushTimeline("go_live", "Review Opened", "Go Live review modal opened.");
  };

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0B090A] px-6 py-4">
          <div>
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[#1E40AF]">
              300 Awakening
            </p>
            <h1 className="text-lg font-bold uppercase tracking-widest text-white">
              Live Experience
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              You are 1 step away from going live · Operator {adminEmail}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-[#1E40AF]/50 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Sync All
            </button>
            <button
              type="button"
              onClick={scrollToPreview}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-[#1E40AF]/50 hover:text-white"
            >
              <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={openGoLiveModal}
              className="rounded-full border border-[#1E40AF]/80 bg-gradient-to-r from-[#1E40AF]/30 to-[#B0267A]/25 px-8 py-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(30,64,175,0.35)] transition hover:brightness-110"
            >
              Go Live
            </button>
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
                />
                <LiveHubReadinessPanel checks={readinessChecks} />
                <LiveHubLowerPanels
                  goLiveDecision={goLiveDecision}
                  backupConfigured={snapshot.stream.backupConfigured}
                  onRunRehearsal={() => void runVmixAction("refresh_state")}
                  onTestStream={() => {
                    scrollToPreview();
                    void refreshAll();
                  }}
                  onShareStream={() => {
                    const url = `${window.location.origin}/dashboard/live`;
                    void navigator.clipboard?.writeText(url);
                    pushTimeline("readiness", "Share Link Copied", url);
                  }}
                />
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
            <div ref={previewRef}>
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

        <LiveHubStatusStrip networkOnline={networkOnline} />
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
