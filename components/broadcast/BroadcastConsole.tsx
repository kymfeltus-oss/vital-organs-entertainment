"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AssistedProducerRoadmap from "@/components/broadcast/AssistedProducerRoadmap";
import AudioMixer from "@/components/broadcast/AudioMixer";
import BroadcastPathBanner from "@/components/broadcast/BroadcastPathBanner";
import CameraGrid from "@/components/broadcast/CameraGrid";
import MixingConsole from "@/components/broadcast/MixingConsole";
import RestreamConfigModal from "@/components/broadcast/RestreamConfigModal";
import ParableSandboxActionModal from "@/components/broadcast/ParableSandboxActionModal";
import ProductionEventsPanel from "@/components/broadcast/ProductionEventsPanel";
import ProductionSafetyPanel from "@/components/broadcast/ProductionSafetyPanel";
import ProductionTelemetryTray from "@/components/broadcast/ProductionTelemetryTray";
import ReadinessGate from "@/components/broadcast/ReadinessGate";
import StreamStatusPanel from "@/components/broadcast/StreamStatusPanel";
import { resolveActiveOpsPreviewHlsUrl } from "@/lib/ops/resolve-active-stream-playback";
import TroubleAlertPopup from "@/components/broadcast/TroubleAlertPopup";
import { useOpsChatTroubleAlerts } from "@/hooks/useOpsChatTroubleAlerts";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useStreamFailoverPoller } from "@/hooks/useStreamFailoverPoller";
import {
  applyLocalWebcamToAudioChannels,
  localMicDbToMeterLevel,
} from "@/hooks/useLocalWebcam";
import { useProductionStore } from "@/hooks/useProductionStore";
import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";
import {
  canGoLive,
  deriveReadinessChecks,
} from "@/lib/broadcast/readinessEngine";
import { isOpsTeamRole } from "@/lib/ops/team-roles";
import { useBroadcastHealth } from "@/lib/parable/BroadcastHealthContext";
import {
  resolveExecutionFlags,
  resolveVmixAdapter,
  resolveVmixHealth,
} from "@/lib/broadcast/telemetryViews";
import { mapStoreToUiViews } from "@/services/broadcast/ProductionBrain";

export default function BroadcastConsole() {
  const {
    store,
    loading,
    error,
    setUiOverrides,
    selectPreview,
    runTransition,
    goLive,
    endLive,
    recordMitigation,
    refresh,
  } = useProductionStore();
  const health = useBroadcastHealth();

  const uiViews = useMemo(() => (store ? mapStoreToUiViews(store) : null), [store]);

  const [localAudioLevel, setLocalAudioLevel] = useState<number>(-Infinity);

  const localMeterLevel = useMemo(
    () => localMicDbToMeterLevel(localAudioLevel),
    [localAudioLevel],
  );

  const mergedAudioChannels = useMemo(() => {
    const channels = uiViews?.audioChannels ?? [];
    if (localMeterLevel <= 4) return channels;
    return applyLocalWebcamToAudioChannels(channels, localMeterLevel);
  }, [localMeterLevel, uiViews?.audioChannels]);

  const { stream: opsStream, opsState } = useOpsStreamStateRealtime({
    audioChannels: mergedAudioChannels,
    streamTelemetry: store?.streamTelemetry ?? null,
    localWebcamAudioLevel: localMeterLevel,
  });

  const {
    issueType: chatTroubleType,
    count: chatTroubleCount,
    clear: clearChatTroubleAlert,
  } = useOpsChatTroubleAlerts({ enabled: Boolean(store) });

  const [canEditPull, setCanEditPull] = useState(false);
  const [restreamConfigOpen, setRestreamConfigOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sandboxModalAction, setSandboxModalAction] = useState<
    "go_live" | "end_live" | null
  >(null);

  useStreamFailoverPoller({
    enabled:
      opsStream?.isLive === true &&
      opsStream.activeSource === "primary" &&
      canEditPull,
  });

  const activeOpsState = useMemo(() => {
    if (!opsState) return null;

    const merged = {
      ...opsState,
      activeSource: opsStream?.activeSource,
      isLive: opsStream?.isLive === true,
    };

    if (opsState.studioEngineMode !== "internal_studio") return merged;

    const cam1Meter = Math.max(opsState.audioLevels.cam1, localMeterLevel);
    const masterValues = [
      cam1Meter,
      opsState.audioLevels.cam2,
      opsState.audioLevels.cam3,
      opsState.audioLevels.cam4,
      opsState.audioLevels.media1,
      opsState.audioLevels.media2,
    ].filter((value) => value > 4);

    return {
      ...merged,
      audioLevels: {
        ...opsState.audioLevels,
        cam1: cam1Meter,
        master:
          masterValues.length > 0
            ? Math.round(masterValues.reduce((sum, value) => sum + value, 0) / masterValues.length)
            : 0,
      },
    };
  }, [localMeterLevel, opsState, opsStream?.activeSource, opsStream?.isLive]);

  useEffect(() => {
    let cancelled = false;

    async function loadCrewRole() {
      try {
        const response = await fetch("/api/ops/crew-role", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { role?: string };
        if (isOpsTeamRole(data.role)) {
          setCanEditPull(data.role === "admin" || data.role === "producer");
        }
      } catch {
        // Default read-only pull panel.
      }
    }

    void loadCrewRole();

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const readinessChecks = useMemo(
    () => (store ? deriveReadinessChecks(store) : []),
    [store],
  );

  const goLiveAllowed = useMemo(
    () =>
      store
        ? canGoLive(
            store.readinessReport,
            store.production.supervisorOverride,
            store.production.supervisorReason,
          )
        : false,
    [store],
  );

  const platformIsLive = opsStream?.isLive === true;

  const computedMonitorHlsUrl = useMemo(
    () => resolveActiveOpsPreviewHlsUrl(opsStream),
    [opsStream],
  );

  const handleRestreamConfigSaved = useCallback(() => {
    void (async () => {
      try {
        const response = await fetch("/api/ops/stream-state", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        await response.json();
      } catch {
        // Realtime hook will catch up on next broadcast.
      }
    })();
  }, []);

  const openRestreamConfig = useCallback(() => {
    setRestreamConfigOpen(true);
  }, []);

  const handleSelectPreview = useCallback(
    async (sourceId: string) => {
      try {
        const result = await selectPreview(sourceId);
        showToast(result.message);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Preview failed.");
      }
    },
    [selectPreview, showToast],
  );

  const handleTransition = useCallback(
    async (type: Parameters<typeof runTransition>[0]) => {
      try {
        const result = await runTransition(type);
        showToast(result.message);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Transition failed.");
      }
    },
    [runTransition, showToast],
  );

  const handleMitigation = useCallback(
    async (checkId: string) => {
      try {
        const result = await recordMitigation(checkId);
        showToast(result.message);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Mitigation log failed.");
      }
    },
    [recordMitigation, showToast],
  );

  const executeSandboxGoLive = useCallback(async () => {
    if (!goLiveAllowed) return;

    if (health.requiresCommandConfirmation("go_live")) {
      const confirmed = window.confirm(
        "Go live under PARABLE Safe Mode?\n\nConfirm to execute the sacred media path.",
      );
      if (!confirmed) return;
      try {
        const result = await goLive(true);
        showToast(result.message);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Go live failed.");
      }
      return;
    }

    try {
      const result = await goLive(false);
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Go live failed.");
    }
  }, [goLive, goLiveAllowed, health, showToast]);

  const executeSandboxEndLive = useCallback(async () => {
    const confirmed = window.confirm(
      "Stop sandbox broadcast?\n\nThis ends the in-memory PARABLE path only.",
    );
    if (!confirmed) return;

    try {
      const result = await endLive(true);
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Stop live failed.");
    }
  }, [endLive, showToast]);

  const handleGoLive = useCallback(() => {
    if (!goLiveAllowed) return;
    setSandboxModalAction("go_live");
  }, [goLiveAllowed]);

  const handleEndLive = useCallback(() => {
    setSandboxModalAction("end_live");
  }, []);

  const handleSandboxModalContinue = useCallback(async () => {
    const action = sandboxModalAction;
    setSandboxModalAction(null);
    if (action === "go_live") {
      await executeSandboxGoLive();
    } else if (action === "end_live") {
      await executeSandboxEndLive();
    }
  }, [executeSandboxEndLive, executeSandboxGoLive, sandboxModalAction]);

  const handleSandboxModalCancel = useCallback(() => {
    setSandboxModalAction(null);
  }, []);

  if (loading && !store) {
    return (
      <div
        className={`flex min-h-dvh min-w-[1280px] ${PARABLE_SHELL.page} items-center justify-center ${PARABLE_SHELL.muted}`}
      >
        <p className="font-ui text-sm uppercase tracking-[0.2em]">Loading production store…</p>
      </div>
    );
  }

  if (!store || !uiViews) {
    return (
      <div
        className={`flex min-h-dvh min-w-[1280px] ${PARABLE_SHELL.page} items-center justify-center px-6 text-center`}
      >
        <p className={`font-body ${PARABLE_SHELL.muted}`}>
          {error ?? "Production store unavailable."}
        </p>
      </div>
    );
  }

  const vmixHealth = resolveVmixHealth(store);
  const executionFlags = resolveExecutionFlags(store);
  const vmixAdapter = resolveVmixAdapter(store);
  const latestHealthAlert = health.alerts[0]?.message ?? null;

  return (
    <div className={`flex min-h-dvh min-w-[1280px] flex-col overflow-x-auto bg-brand-black`}>
      <BroadcastPathBanner platformIsLive={platformIsLive} />

      <ProductionTelemetryTray
        architectureVersion={store.meta.architectureVersion ?? "1.0"}
        rehearsalMode={store.meta.rehearsalMode === true}
        onRehearsalModeChange={(enabled) => {
          setUiOverrides({ rehearsalMode: enabled });
          void refresh();
        }}
        vmixAdapter={vmixAdapter}
        vmixHealth={vmixHealth}
        executionFlags={executionFlags}
        pipelineTrace={store.meta.pipelineTrace}
        productionLog={store.productionLog}
        healthSeverity={health.severity}
        healthAlert={latestHealthAlert}
        safeMode={health.safeMode}
        usingCachedSnapshot={health.usingCachedSnapshot}
        onSafeModeToggle={() => health.setSafeModeManual(!health.safeModeManual)}
      />

      {toast ? (
        <p
          className="mx-2 mt-1 rounded border border-brand-blue/40 bg-brand-blue/10 px-2 py-1 font-ui text-[0.65rem] text-white"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col gap-2 px-2 py-2">
        <MixingConsole
          sources={uiViews.sources}
          previewSourceId={store.previewSourceId}
          programSourceId={store.programSourceId}
          production={store.production}
          sandboxIsLive={store.production.isLive}
          platformIsLive={platformIsLive}
          opsStream={opsStream}
          opsState={activeOpsState}
          audioChannels={mergedAudioChannels}
          readinessScore={store.readinessReport.score}
          canGoLive={goLiveAllowed}
          rehearsalMode={store.meta.rehearsalMode === true}
          pushConfigured={opsStream?.primaryRtmpConfigured === true}
          pullConfigured={opsStream?.primaryRtmpPullConfigured === true}
          previewConfigured={opsStream?.cameraPreviewConfigured === true}
          onOpenRestreamConfig={openRestreamConfig}
          onTransition={handleTransition}
          onGoLive={handleGoLive}
          onEndLive={handleEndLive}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2">
          <CameraGrid
            sources={uiViews.sources}
            previewSourceId={store.previewSourceId}
            programSourceId={store.programSourceId}
            platformIsLive={platformIsLive}
            opsStream={opsStream}
            monitorHlsUrl={computedMonitorHlsUrl}
            onSelectPreview={handleSelectPreview}
            onOpenRestreamConfig={openRestreamConfig}
            onLocalAudioUpdate={setLocalAudioLevel}
            emptyLabel={
              store.sources.length === 0
                ? store.meta.devMode
                  ? "DEV_MODE — simulated discovery in progress"
                  : "No hardware connected — awaiting adapter"
                : undefined
            }
          />
          <AudioMixer channels={mergedAudioChannels} />
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-2 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <ReadinessGate
              score={store.readinessReport.score}
              checks={readinessChecks}
              canGoLive={goLiveAllowed}
              isLive={store.production.isLive}
              rehearsalMode={store.meta.rehearsalMode === true}
              criticalCount={store.readinessReport.criticalFailures.length}
              supervisorOverride={store.production.supervisorOverride}
              supervisorReason={store.production.supervisorReason}
              onSupervisorOverrideChange={(enabled, reason) =>
                setUiOverrides({ supervisorOverride: enabled, supervisorReason: reason })
              }
              onGoLive={handleGoLive}
              onEndLive={handleEndLive}
            />
          </div>
          <div className="xl:col-span-4">
            <ProductionSafetyPanel
              checks={readinessChecks}
              safetyActions={store.safetyActions}
              onMitigation={handleMitigation}
            />
          </div>
          <div className="xl:col-span-4">
            <StreamStatusPanel
              destinations={store.streamTelemetry.destinations}
              isLive={store.production.isLive || platformIsLive}
              streamBitrateKbps={store.streamTelemetry.bitrateKbps}
              packetLossPercent={store.streamTelemetry.packetLossPercent}
              pipelineAvailable={store.streamTelemetry.pipelineAvailable}
            />
          </div>
        </div>

        <ProductionEventsPanel entries={store.productionLog} />

        <AssistedProducerRoadmap />
      </main>

      {sandboxModalAction ? (
        <ParableSandboxActionModal
          action={sandboxModalAction}
          onCancel={handleSandboxModalCancel}
          onContinue={() => void handleSandboxModalContinue()}
        />
      ) : null}

      <RestreamConfigModal
        isOpen={restreamConfigOpen}
        canEdit={canEditPull}
        initialStudioEngineMode={opsStream?.studioEngineMode}
        pullEngineStatus={opsState?.pullEngineStatus}
        onClose={() => setRestreamConfigOpen(false)}
        onSaved={handleRestreamConfigSaved}
        onShowToast={showToast}
      />

      <TroubleAlertPopup
        issueType={chatTroubleType}
        count={chatTroubleCount}
        onClear={clearChatTroubleAlert}
      />
    </div>
  );
}
