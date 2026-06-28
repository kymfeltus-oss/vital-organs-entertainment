"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RECORDING_ARCHIVE_EVENT,
  RECORDING_ARCHIVE_STORAGE_KEY,
  completeRecordingArchiveJob,
  createRecordingArchiveJob,
  getShowConfiguration,
  getShowJobs,
  parseArchiveState,
  serializeArchiveState,
  upsertRecordingConfiguration,
  validateArchiveJobStart,
  validateRecordingConfiguration,
  type RecordingArchiveState,
} from "@/lib/owner/recording-archive-store";
import type { ArchiveJob, RecordingConfiguration } from "@/types/recording";

type MutationResult = {
  ok: boolean;
  message: string;
};

function readState(): RecordingArchiveState {
  if (typeof window === "undefined") return { configurations: [], jobs: [] };
  return parseArchiveState(window.localStorage.getItem(RECORDING_ARCHIVE_STORAGE_KEY));
}

function writeState(state: RecordingArchiveState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECORDING_ARCHIVE_STORAGE_KEY, serializeArchiveState(state));
  window.dispatchEvent(new CustomEvent(RECORDING_ARCHIVE_EVENT));
}

export function useRecordingArchiveStore(showId: string, showTitle: string) {
  const [state, setState] = useState<RecordingArchiveState>({ configurations: [], jobs: [] });
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setState(readState());
      setError(null);
    } catch {
      setState({ configurations: [], jobs: [] });
      setError("Archive storage could not be parsed. Using a fail-safe empty vault.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    reload();
    const handleStorage = () => reload();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(RECORDING_ARCHIVE_EVENT, handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(RECORDING_ARCHIVE_EVENT, handleStorage);
    };
  }, [reload]);

  const persist = useCallback((next: RecordingArchiveState): MutationResult => {
    try {
      setState(next);
      writeState(next);
      setError(null);
      return { ok: true, message: "Archive state synced." };
    } catch {
      setError("Archive storage write failed.");
      return { ok: false, message: "Archive policy could not be saved." };
    }
  }, []);

  const config = useMemo(() => getShowConfiguration(state, showId), [showId, state]);
  const jobs = useMemo(() => getShowJobs(state, showId), [showId, state]);
  const activeJob = useMemo(
    () => jobs.find((job) => job.status === "RECORDING" || job.status === "PROCESSING") ?? null,
    [jobs],
  );

  const commitConfiguration = useCallback(
    (nextConfig: RecordingConfiguration): MutationResult => {
      const validationError = validateRecordingConfiguration(nextConfig);
      if (validationError) return { ok: false, message: validationError };
      return persist(upsertRecordingConfiguration(state, nextConfig));
    },
    [persist, state],
  );

  const simulateStreamStop = useCallback(async (): Promise<MutationResult> => {
    const validationError = validateArchiveJobStart({ config, activeJob });
    if (validationError) return { ok: false, message: validationError };

    const startedJob = createRecordingArchiveJob(config, showTitle);
    const recordingState = {
      ...state,
      configurations: upsertRecordingConfiguration(state, config).configurations,
      jobs: [startedJob, ...state.jobs],
    };
    const startResult = persist(recordingState);
    if (!startResult.ok) return startResult;

    await new Promise((resolve) => window.setTimeout(resolve, 600));
    const processingState = {
      ...recordingState,
      jobs: recordingState.jobs.map((job) =>
        job.id === startedJob.id ? { ...job, status: "PROCESSING" as const } : job,
      ),
    };
    persist(processingState);

    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const completedJob = completeRecordingArchiveJob(startedJob, config);
    return persist({
      ...processingState,
      jobs: processingState.jobs.map((job) => (job.id === startedJob.id ? completedJob : job)),
    });
  }, [activeJob, config, persist, showTitle, state]);

  return {
    config,
    jobs,
    activeJob,
    hydrated,
    error,
    commitConfiguration,
    simulateStreamStop,
  };
}

export type { ArchiveJob, RecordingConfiguration };
