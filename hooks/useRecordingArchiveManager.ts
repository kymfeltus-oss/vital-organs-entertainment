"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  completeRecordingArchiveJob,
  createRecordingArchiveJob,
  getShowConfiguration,
  getShowJobs,
  parseArchiveState,
  serializeArchiveState,
  upsertRecordingConfiguration,
  validateArchiveJobStart,
  validateRecordingConfiguration,
  RECORDING_ARCHIVE_EVENT,
  RECORDING_ARCHIVE_STORAGE_KEY,
  type RecordingArchiveState,
} from "@/lib/owner/recording-archive-store";
import type {
  ArchiveJob,
  RecordingConfiguration,
  RecordingTargetType,
} from "@/types/recording";

export function useRecordingArchiveManager(showId: string, showTitle: string) {
  const [archiveState, setArchiveState] = useState<RecordingArchiveState>({
    configurations: [],
    jobs: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingJob, setIsProcessingJob] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const persistState = useCallback((nextState: RecordingArchiveState) => {
    window.localStorage.setItem(RECORDING_ARCHIVE_STORAGE_KEY, serializeArchiveState(nextState));
    window.dispatchEvent(new CustomEvent(RECORDING_ARCHIVE_EVENT));
    setArchiveState(nextState);
  }, []);

  const loadStoredData = useCallback(() => {
    try {
      const nextState = parseArchiveState(
        window.localStorage.getItem(RECORDING_ARCHIVE_STORAGE_KEY),
      );
      setArchiveState(nextState);
      setErrorMessage(null);
    } catch {
      setArchiveState({ configurations: [], jobs: [] });
      setErrorMessage(
        "Failed to initialize local recording configuration database or assets are corrupted.",
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    loadStoredData();
    const handleArchiveUpdate = () => loadStoredData();
    window.addEventListener("storage", handleArchiveUpdate);
    window.addEventListener(RECORDING_ARCHIVE_EVENT, handleArchiveUpdate);
    return () => {
      window.removeEventListener("storage", handleArchiveUpdate);
      window.removeEventListener(RECORDING_ARCHIVE_EVENT, handleArchiveUpdate);
    };
  }, [loadStoredData]);

  const config = useMemo(
    () => getShowConfiguration(archiveState, showId),
    [archiveState, showId],
  );
  const jobs = useMemo(() => getShowJobs(archiveState, showId), [archiveState, showId]);
  const activeJob = useMemo(
    () => jobs.find((job) => job.status === "RECORDING" || job.status === "PROCESSING") ?? null,
    [jobs],
  );

  const saveRecordingConfiguration = useCallback(
    async (
      updatedType: RecordingTargetType,
      resolution: "1080p" | "720p",
      watermark: boolean,
      s3BucketPath?: string,
    ) => {
      if (isSaving) return;
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const updatedConfig: RecordingConfiguration = {
          ...config,
          targetType: updatedType,
          resolution,
          watermarkEnabled: watermark,
          s3BucketPath: s3BucketPath ?? config.s3BucketPath,
        };
        const validationError = validateRecordingConfiguration(updatedConfig);
        if (validationError) throw new Error(validationError);

        persistState(upsertRecordingConfiguration(archiveState, updatedConfig));
        setSuccessMessage("Recording configuration rules propagated successfully across cloud enclaves.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unhandled exception occurred while saving recording specifications.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [archiveState, config, isSaving, persistState],
  );

  const triggerLiveArchiveProcess = useCallback(async () => {
    if (isProcessingJob) return;
    setIsProcessingJob(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const validationError = validateArchiveJobStart({ config, activeJob });
      if (validationError) throw new Error(validationError);

      const startedJob = createRecordingArchiveJob(config, showTitle);
      const recordingState = {
        ...upsertRecordingConfiguration(archiveState, config),
        jobs: [startedJob, ...archiveState.jobs],
      };
      persistState(recordingState);

      await new Promise((resolve) => window.setTimeout(resolve, 600));
      const processingState: RecordingArchiveState = {
        ...recordingState,
        jobs: recordingState.jobs.map((job) =>
          job.id === startedJob.id ? { ...job, status: "PROCESSING" } : job,
        ),
      };
      persistState(processingState);

      await new Promise((resolve) => window.setTimeout(resolve, 900));
      const completedJob: ArchiveJob = completeRecordingArchiveJob(startedJob, config);
      persistState({
        ...processingState,
        jobs: processingState.jobs.map((job) =>
          job.id === startedJob.id ? completedJob : job,
        ),
      });
      setSuccessMessage("Asynchronous stream archival split run successfully generated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to execute the live-to-vault pipeline process hook.",
      );
    } finally {
      setIsProcessingJob(false);
    }
  }, [activeJob, archiveState, config, isProcessingJob, persistState, showTitle]);

  return {
    config,
    jobs,
    activeJob,
    hydrated,
    isSaving,
    isProcessingJob,
    errorMessage,
    successMessage,
    saveRecordingConfiguration,
    triggerLiveArchiveProcess,
  };
}
