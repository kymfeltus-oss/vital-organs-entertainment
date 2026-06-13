"use client";

import { useCallback, useMemo, useState } from "react";
import AssistedProducerRoadmap from "@/components/broadcast/AssistedProducerRoadmap";
import AudioMixer from "@/components/broadcast/AudioMixer";
import InputTray from "@/components/broadcast/InputTray";
import PreviewProgram from "@/components/broadcast/PreviewProgram";
import ProductionEventsPanel from "@/components/broadcast/ProductionEventsPanel";
import ProductionSafetyPanel from "@/components/broadcast/ProductionSafetyPanel";
import ProductionTelemetryTray from "@/components/broadcast/ProductionTelemetryTray";
import ReadinessGate from "@/components/broadcast/ReadinessGate";
import StreamStatusPanel from "@/components/broadcast/StreamStatusPanel";
import { useProductionStore } from "@/hooks/useProductionStore";
import { PARABLE_SHELL } from "@/lib/broadcast/parable-tokens";
import {
  canGoLive,
  deriveReadinessChecks,
} from "@/lib/broadcast/readinessEngine";
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

  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const uiViews = useMemo(() => (store ? mapStoreToUiViews(store) : null), [store]);

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

  const handleGoLive = useCallback(async () => {
    if (!goLiveAllowed) return;
    try {
      const result = await goLive();
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Go live failed.");
    }
  }, [goLive, goLiveAllowed, showToast]);

  const handleEndLive = useCallback(async () => {
    try {
      const result = await endLive();
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Stop live failed.");
    }
  }, [endLive, showToast]);

  if (loading && !store) {
    return (
      <div className={`flex min-h-dvh min-w-[1280px] ${PARABLE_SHELL.page} items-center justify-center ${PARABLE_SHELL.muted}`}>
        <p className="font-ui text-sm uppercase tracking-[0.2em]">Loading production store…</p>
      </div>
    );
  }

  if (!store || !uiViews) {
    return (
      <div className={`flex min-h-dvh min-w-[1280px] ${PARABLE_SHELL.page} items-center justify-center px-6 text-center`}>
        <p className={`font-body ${PARABLE_SHELL.muted}`}>
          {error ?? "Production store unavailable."}
        </p>
      </div>
    );
  }

  const vmixHealth = resolveVmixHealth(store);
  const executionFlags = resolveExecutionFlags(store);
  const vmixAdapter = resolveVmixAdapter(store);

  return (
    <div className={`flex min-h-dvh min-w-[1280px] flex-col overflow-x-auto ${PARABLE_SHELL.page}`}>
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
      />

      {toast ? (
        <p
          className={`mx-2 mt-1 rounded border px-2 py-1 font-ui text-[0.65rem] text-white ${PARABLE_SHELL.borderBlue} bg-[#1E40AF]/10`}
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <main className="grid min-h-0 flex-1 grid-cols-12 gap-1 px-2 py-1">
        <div className="col-span-9 flex min-h-0 flex-col gap-1">
          <PreviewProgram
            sources={uiViews.sources}
            previewSourceId={store.previewSourceId}
            programSourceId={store.programSourceId}
            production={store.production}
            isLive={store.production.isLive}
            audioChannels={uiViews.audioChannels}
            onTransition={handleTransition}
          />

          <InputTray
            sources={uiViews.sources}
            previewSourceId={store.previewSourceId}
            programSourceId={store.programSourceId}
            onSelectPreview={handleSelectPreview}
            emptyLabel={
              store.sources.length === 0
                ? store.meta.devMode
                  ? "DEV_MODE — simulated discovery in progress"
                  : "No hardware connected — awaiting adapter"
                : undefined
            }
          />

          <AudioMixer channels={uiViews.audioChannels} />

          <ProductionEventsPanel entries={store.productionLog} />
        </div>

        <aside className="col-span-3 flex min-h-0 flex-col gap-1">
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

          <ProductionSafetyPanel
            checks={readinessChecks}
            safetyActions={store.safetyActions}
            onMitigation={handleMitigation}
          />

          <StreamStatusPanel
            destinations={store.streamTelemetry.destinations}
            isLive={store.production.isLive}
            streamBitrateKbps={store.streamTelemetry.bitrateKbps}
            packetLossPercent={store.streamTelemetry.packetLossPercent}
            pipelineAvailable={store.streamTelemetry.pipelineAvailable}
          />

          <AssistedProducerRoadmap />
        </aside>
      </main>
    </div>
  );
}
