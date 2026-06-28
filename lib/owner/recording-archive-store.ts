import type {
  ArchiveAsset,
  ArchiveJob,
  RecordingConfiguration,
  RecordingTargetType,
} from "@/types/recording";

export const RECORDING_ARCHIVE_STORAGE_KEY = "300-awakening-recording-archive-v1";
export const RECORDING_ARCHIVE_EVENT = "300-awakening-recording-archive-updated";

export type RecordingArchiveState = {
  configurations: RecordingConfiguration[];
  jobs: ArchiveJob[];
};

export type RecordingArchiveValidationInput = {
  config: RecordingConfiguration | null;
  activeJob: ArchiveJob | null;
};

const VALID_TARGET_TYPES: RecordingTargetType[] = [
  "CLEAN_ONLY",
  "BURNED_CHAT_ONLY",
  "DUAL_TRACK_BOTH",
];

function safeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function buildDefaultRecordingConfiguration(showId: string): RecordingConfiguration {
  return {
    id: `recording-config-${showId}`,
    showId,
    targetType: "DUAL_TRACK_BOTH",
    s3BucketPath: `s3://300-awakening-archives/${showId}`,
    resolution: "1080p",
    watermarkEnabled: true,
  };
}

export function parseArchiveState(raw: string | null): RecordingArchiveState {
  if (!raw) return { configurations: [], jobs: [] };
  const parsed = JSON.parse(raw) as Partial<RecordingArchiveState>;
  return {
    configurations: Array.isArray(parsed.configurations)
      ? parsed.configurations.filter(isRecordingConfiguration)
      : [],
    jobs: Array.isArray(parsed.jobs) ? parsed.jobs.filter(isArchiveJob) : [],
  };
}

export function serializeArchiveState(state: RecordingArchiveState): string {
  return JSON.stringify({
    configurations: state.configurations,
    jobs: state.jobs,
  });
}

export function validateRecordingConfiguration(config: RecordingConfiguration | null): string | null {
  if (!config?.id || !config.showId) return "Active recording configuration is missing.";
  if (!VALID_TARGET_TYPES.includes(config.targetType)) return "Recording target type is invalid.";
  if (config.resolution !== "1080p" && config.resolution !== "720p") {
    return "Recording resolution must be 1080p or 720p.";
  }
  if (!/^s3:\/\/[a-z0-9.-]+\/[A-Za-z0-9/_-]+$/i.test(config.s3BucketPath.trim())) {
    return "Archive bucket path must use s3://bucket/show-folder format.";
  }
  return null;
}

export function validateArchiveJobStart(input: RecordingArchiveValidationInput): string | null {
  const configError = validateRecordingConfiguration(input.config);
  if (configError) return configError;
  if (input.activeJob?.status === "RECORDING" || input.activeJob?.status === "PROCESSING") {
    return "Archive processing is already running for this show.";
  }
  return null;
}

export function upsertRecordingConfiguration(
  state: RecordingArchiveState,
  config: RecordingConfiguration,
): RecordingArchiveState {
  return {
    ...state,
    configurations: [
      ...state.configurations.filter((item) => item.showId !== config.showId),
      {
        ...config,
        s3BucketPath: config.s3BucketPath.trim(),
      },
    ],
  };
}

export function createRecordingArchiveJob(
  config: RecordingConfiguration,
  showTitle: string,
): ArchiveJob {
  return {
    id: safeId("archive-job"),
    showId: config.showId,
    showTitle,
    status: "RECORDING",
    startedAt: new Date().toISOString(),
    endedAt: null,
    assets: [],
  };
}

export function completeRecordingArchiveJob(job: ArchiveJob, config: RecordingConfiguration): ArchiveJob {
  const endedAt = new Date().toISOString();
  return {
    ...job,
    status: "COMPLETED",
    endedAt,
    assets: buildArchiveAssets(job, config, endedAt),
  };
}

export function getShowConfiguration(
  state: RecordingArchiveState,
  showId: string,
): RecordingConfiguration {
  return (
    state.configurations.find((config) => config.showId === showId) ??
    buildDefaultRecordingConfiguration(showId)
  );
}

export function getShowJobs(state: RecordingArchiveState, showId: string): ArchiveJob[] {
  return state.jobs
    .filter((job) => job.showId === showId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function buildArchiveAssets(
  job: ArchiveJob,
  config: RecordingConfiguration,
  createdAt: string,
): ArchiveAsset[] {
  const basePath = config.s3BucketPath.replace(/\/+$/, "");
  const durationSeconds = config.resolution === "1080p" ? 5400 : 5400;
  const cleanAsset: ArchiveAsset = {
    id: safeId("archive-asset-clean"),
    jobId: job.id,
    showId: job.showId,
    title: `${job.showTitle} - Clean Program`,
    assetType: "CLEAN_RAW",
    videoUrl: `${basePath}/${job.id}/clean-program-${config.resolution}.mp4`,
    fileSizeMb: config.resolution === "1080p" ? 8420 : 4910,
    durationSeconds,
    createdAt,
  };
  const burnedChatAsset: ArchiveAsset = {
    id: safeId("archive-asset-chat"),
    jobId: job.id,
    showId: job.showId,
    title: `${job.showTitle} - Burned Chat Replay`,
    assetType: "BURNED_CHAT",
    videoUrl: `${basePath}/${job.id}/burned-chat-${config.resolution}.mp4`,
    fileSizeMb: config.resolution === "1080p" ? 9010 : 5250,
    durationSeconds,
    createdAt,
  };
  if (config.targetType === "CLEAN_ONLY") return [cleanAsset];
  if (config.targetType === "BURNED_CHAT_ONLY") return [burnedChatAsset];
  return [cleanAsset, burnedChatAsset];
}

function isRecordingConfiguration(value: unknown): value is RecordingConfiguration {
  const item = value as Partial<RecordingConfiguration>;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.showId === "string" &&
      VALID_TARGET_TYPES.includes(item.targetType as RecordingTargetType) &&
      typeof item.s3BucketPath === "string" &&
      (item.resolution === "1080p" || item.resolution === "720p") &&
      typeof item.watermarkEnabled === "boolean",
  );
}

function isArchiveJob(value: unknown): value is ArchiveJob {
  const item = value as Partial<ArchiveJob>;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.showId === "string" &&
      typeof item.showTitle === "string" &&
      (item.status === "RECORDING" ||
        item.status === "PROCESSING" ||
        item.status === "COMPLETED" ||
        item.status === "FAILED") &&
      typeof item.startedAt === "string" &&
      Array.isArray(item.assets),
  );
}
