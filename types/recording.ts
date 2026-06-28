export type RecordingTargetType = "CLEAN_ONLY" | "BURNED_CHAT_ONLY" | "DUAL_TRACK_BOTH";
export type ArchiveJobStatus = "RECORDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface RecordingConfiguration {
  id: string;
  showId: string;
  targetType: RecordingTargetType;
  s3BucketPath: string;
  resolution: "1080p" | "720p";
  watermarkEnabled: boolean;
}

export interface ArchiveAsset {
  id: string;
  jobId: string;
  showId: string;
  title: string;
  assetType: "CLEAN_RAW" | "BURNED_CHAT";
  videoUrl: string;
  fileSizeMb: number;
  durationSeconds: number;
  createdAt: string;
}

export interface ArchiveJob {
  id: string;
  showId: string;
  showTitle: string;
  status: ArchiveJobStatus;
  startedAt: string;
  endedAt: string | null;
  assets: ArchiveAsset[];
  errorLog?: string;
}
