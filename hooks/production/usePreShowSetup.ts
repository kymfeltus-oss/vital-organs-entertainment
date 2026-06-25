"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCountdownChatTroubleAlerts } from "@/hooks/useCountdownChatTroubleAlerts";
import { useCountdownHeroEditor } from "@/hooks/useCountdownHeroEditor";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import {
  scheduleDatetimeLocalToIso,
  resolveScheduleTimezone,
} from "@/lib/live/schedule-timezone";
import {
  buildPreShowSummaryCards,
  computePreShowReadiness,
  createDefaultPreShowState,
  PRESHOW_WIZARD_STEPS,
  type PreShowSetupState,
  type PreShowStepId,
  type SaveEndpointStatus,
  validatePreShowStep,
} from "@/lib/production/preshow-setup";
import {
  buildPrimaryRtmpIngestUrl,
  splitRtmpIngestUrl,
} from "@/lib/stream-keys";

type UsePreShowSetupOptions = {
  initialConfig: EventCountdownConfig;
};

export function usePreShowSetup({ initialConfig }: UsePreShowSetupOptions) {
  const router = useRouter();
  const heroEditor = useCountdownHeroEditor({ initialConfig });
  const { stream, opsState, refreshStream } = useOpsStreamStateRealtime();
  const chatAlerts = useCountdownChatTroubleAlerts({ enabled: true });

  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saveEndpointStatus, setSaveEndpointStatus] =
    useState<SaveEndpointStatus>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [preflightRan, setPreflightRan] = useState(false);
  const [ingestLoaded, setIngestLoaded] = useState(false);

  const [localFields, setLocalFields] = useState<
    Pick<
      PreShowSetupState,
      | "countdownStartTime"
      | "rtmpIngestServer"
      | "streamKey"
      | "hlsPreviewUrl"
      | "primaryCameraLabel"
      | "backupCameraLabel"
      | "masterAudioSource"
      | "outputDestinations"
      | "givingEnabled"
      | "vitalSeedsEnabled"
      | "monetizationEnabled"
      | "chatModerationEnabled"
      | "emergencyBackupStreamUrl"
      | "finalConfirmed"
    >
  >(() => ({
    countdownStartTime: "",
    rtmpIngestServer: "",
    streamKey: "",
    hlsPreviewUrl: "",
    primaryCameraLabel: "",
    backupCameraLabel: "",
    masterAudioSource: "",
    outputDestinations: [],
    givingEnabled: false,
    vitalSeedsEnabled: false,
    monetizationEnabled: false,
    chatModerationEnabled: true,
    emergencyBackupStreamUrl: "",
    finalConfirmed: false,
  }));

  const currentStep = PRESHOW_WIZARD_STEPS[stepIndex] ?? PRESHOW_WIZARD_STEPS[0];

  const setupState = useMemo((): PreShowSetupState => {
    const { formState } = heroEditor;
    return createDefaultPreShowState({
      eventTitle: formState.headline,
      eventDate: formState.showDate,
      liveStartTime: formState.showTime,
      timezone: resolveScheduleTimezone(formState.timezone),
      ...localFields,
    });
  }, [heroEditor, localFields]);

  const readiness = useMemo(
    () => computePreShowReadiness(setupState),
    [setupState],
  );

  const summaryCards = useMemo(
    () => buildPreShowSummaryCards(setupState),
    [setupState],
  );

  const loadIngestConfig = useCallback(async () => {
    try {
      const [ingestRes, pullRes] = await Promise.all([
        fetch("/api/ops/stream-ingest", { credentials: "include", cache: "no-store" }),
        fetch("/api/ops/stream-pull", { credentials: "include", cache: "no-store" }),
      ]);

      const nextLocal: Partial<typeof localFields> = {};

      if (ingestRes.ok) {
        const data = (await ingestRes.json()) as {
          serverUrl?: string;
          streamKey?: string;
          primaryRtmpIngestUrl?: string | null;
        };
        const creds =
          data.serverUrl && data.streamKey
            ? { serverUrl: data.serverUrl, streamKey: data.streamKey }
            : splitRtmpIngestUrl(data.primaryRtmpIngestUrl);
        if (creds) {
          nextLocal.rtmpIngestServer = creds.serverUrl;
          nextLocal.streamKey = creds.streamKey;
        }
      }

      if (pullRes.ok) {
        const pullData = (await pullRes.json()) as {
          cameraPreviewHlsUrl?: string | null;
        };
        nextLocal.hlsPreviewUrl = pullData.cameraPreviewHlsUrl ?? "";
      }

      if (Object.keys(nextLocal).length > 0) {
        setLocalFields((current) => ({ ...current, ...nextLocal }));
      }
    } catch {
      setSaveMessage("Unable to load stream ingest configuration.");
    } finally {
      setIngestLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadIngestConfig();
  }, [loadIngestConfig]);

  const updateField = useCallback(
    (field: PreShowStepId, value: string | boolean | string[]) => {
      setStepError(null);
      setSaveMessage(null);

      switch (field) {
        case "eventTitle":
          heroEditor.setField("headline", String(value));
          break;
        case "eventDate":
          heroEditor.setField("showDate", String(value));
          break;
        case "liveStartTime":
          heroEditor.setField("showTime", String(value));
          break;
        case "timezone":
          heroEditor.setField("timezone", resolveScheduleTimezone(String(value)));
          break;
        case "finalConfirmation":
          setLocalFields((current) => ({ ...current, finalConfirmed: Boolean(value) }));
          break;
        default:
          setLocalFields((current) => ({ ...current, [field]: value }));
      }
    },
    [heroEditor],
  );

  const validateCurrentStep = useCallback((): boolean => {
    const error = validatePreShowStep(currentStep.id, setupState);
    if (error) {
      setStepError(error);
      return false;
    }
    setStepError(null);
    return true;
  }, [currentStep.id, setupState]);

  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    setStepIndex((index) => Math.min(index + 1, PRESHOW_WIZARD_STEPS.length - 1));
  }, [validateCurrentStep]);

  const goPrevious = useCallback(() => {
    setStepError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setStepError(null);
    setStepIndex(Math.max(0, Math.min(index, PRESHOW_WIZARD_STEPS.length - 1)));
  }, []);

  const saveScheduleStep = useCallback(async (): Promise<boolean> => {
    const saved = await heroEditor.saveHeroCopyForm();
    if (!saved) {
      setSaveMessage(heroEditor.saveError ?? "Unable to save schedule settings.");
      return false;
    }
    setSaveMessage("Schedule saved.");
    return true;
  }, [heroEditor]);

  const saveStreamIngestStep = useCallback(async (): Promise<boolean> => {
    if (!setupState.rtmpIngestServer.trim() || !setupState.streamKey.trim()) {
      setSaveMessage("RTMP server and stream key are required.");
      return false;
    }

    try {
      const primaryRtmpIngestUrl = buildPrimaryRtmpIngestUrl(
        setupState.streamKey,
        setupState.rtmpIngestServer,
      );
      const response = await fetch("/api/ops/stream-ingest", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryRtmpIngestUrl }),
        cache: "no-store",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setSaveMessage(data.error ?? "Unable to save stream ingest.");
        return false;
      }
      await refreshStream();
      setSaveMessage("Stream ingest saved.");
      return true;
    } catch {
      setSaveMessage("Unable to save stream ingest.");
      return false;
    }
  }, [refreshStream, setupState.rtmpIngestServer, setupState.streamKey]);

  const savePreviewStep = useCallback(async (): Promise<boolean> => {
    if (!setupState.hlsPreviewUrl.trim()) {
      setSaveMessage("HLS preview URL is required.");
      return false;
    }

    try {
      const response = await fetch("/api/ops/stream-pull", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraPreviewHlsUrl: setupState.hlsPreviewUrl.trim() || null,
        }),
        cache: "no-store",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setSaveMessage(data.error ?? "Unable to save HLS preview URL.");
        return false;
      }
      setSaveMessage("Preview playback URL saved.");
      return true;
    } catch {
      setSaveMessage("Unable to save HLS preview URL.");
      return false;
    }
  }, [setupState.hlsPreviewUrl]);

  const saveLocalOnlyStep = useCallback(async (): Promise<boolean> => {
    // TODO: Connect production pre-show local fields to a dedicated save endpoint
    // when backend support lands (camera labels, audio, audience toggles, backup URL).
    setSaveMessage("Save endpoint not connected — stored in session only.");
    return false;
  }, []);

  const saveCurrentStep = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setSaveEndpointStatus("saving");
    setSaveMessage(null);

    let ok = false;
    switch (currentStep.id) {
      case "eventTitle":
      case "eventDate":
      case "countdownStartTime":
      case "liveStartTime":
      case "timezone":
        ok = await saveScheduleStep();
        break;
      case "rtmpIngestServer":
      case "streamKey":
        ok = await saveStreamIngestStep();
        break;
      case "hlsPreviewUrl":
        ok = await savePreviewStep();
        break;
      default:
        ok = await saveLocalOnlyStep();
    }

    setSaveEndpointStatus(ok ? "connected" : "disconnected");
  }, [
    currentStep.id,
    saveLocalOnlyStep,
    savePreviewStep,
    saveScheduleStep,
    saveStreamIngestStep,
    validateCurrentStep,
  ]);

  const saveAllSettings = useCallback(async () => {
    setSaveEndpointStatus("saving");
    setSaveMessage(null);

    const scheduleOk = await saveScheduleStep();
    const ingestOk = await saveStreamIngestStep();
    const previewOk = await savePreviewStep();
    const localOk = await saveLocalOnlyStep();

    const connectedCount = [scheduleOk, ingestOk, previewOk].filter(Boolean).length;

    if (scheduleOk && ingestOk && previewOk && !localOk) {
      setSaveEndpointStatus("partial");
      setSaveMessage(
        "Schedule, ingest, and preview saved. Extended production fields: save endpoint not connected.",
      );
    } else if (connectedCount === 3) {
      setSaveEndpointStatus("connected");
      setSaveMessage("All connected endpoints saved.");
    } else if (connectedCount > 0) {
      setSaveEndpointStatus("partial");
      setSaveMessage("Partial save — review errors and retry.");
    } else {
      setSaveEndpointStatus("disconnected");
      setSaveMessage("Save failed — check required fields.");
    }
  }, [saveLocalOnlyStep, savePreviewStep, saveScheduleStep, saveStreamIngestStep]);

  const runPreflightCheck = useCallback(() => {
    setPreflightRan(true);
    setSaveMessage(`Pre-flight complete — score ${readiness.score}/100.`);
  }, [readiness.score]);

  const goToDashboard = useCallback(() => {
    router.push("/production-dashboard");
  }, [router]);

  const countdownStartIso = useMemo(() => {
    if (!setupState.eventDate || !setupState.countdownStartTime) return null;
    return scheduleDatetimeLocalToIso(
      `${setupState.eventDate}T${setupState.countdownStartTime}`,
      setupState.timezone,
    );
  }, [setupState.countdownStartTime, setupState.eventDate, setupState.timezone]);

  const liveStartIso = useMemo(() => {
    if (!setupState.eventDate || !setupState.liveStartTime) return null;
    return scheduleDatetimeLocalToIso(
      `${setupState.eventDate}T${setupState.liveStartTime}`,
      setupState.timezone,
    );
  }, [setupState.eventDate, setupState.liveStartTime, setupState.timezone]);

  return {
    stepIndex,
    currentStep,
    totalSteps: PRESHOW_WIZARD_STEPS.length,
    setupState,
    stepError,
    saveMessage,
    saveEndpointStatus,
    readiness,
    summaryCards,
    preflightRan,
    ingestLoaded,
    stream,
    opsState,
    chatAlerts,
    countdownStartIso,
    liveStartIso,
    updateField,
    goNext,
    goPrevious,
    goToStep,
    saveCurrentStep,
    saveAllSettings,
    runPreflightCheck,
    goToDashboard,
    isSavingSchedule: heroEditor.isSaving,
    heroPreview: heroEditor.formState,
  };
}

export type UsePreShowSetupReturn = ReturnType<typeof usePreShowSetup>;
