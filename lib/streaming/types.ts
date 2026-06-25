import type { StreamingLiveStatus } from "@/lib/streaming/live-status";

export type StreamingPlatform =
  | "youtube"
  | "facebook"
  | "church_website"
  | "vimeo"
  | "twitch"
  | "custom_rtmp";

export type StreamingConnectionStatus =
  | "not_connected"
  | "connected"
  | "needs_attention"
  | "ready"
  | "error";

export type { StreamingLiveStatus } from "@/lib/streaming/live-status";
export { STREAMING_LIVE_STATUS_DEFAULT, STREAMING_LIVE_STATUSES } from "@/lib/streaming/live-status";

/** Safe fields returned to the browser — never includes tokens or stream keys */
export type StreamingDestinationPublic = {
  id: string;
  platform: StreamingPlatform | string;
  displayName: string;
  accountName: string | null;
  channelId: string | null;
  channelName: string | null;
  profileImageUrl: string | null;
  lastAuthenticatedAt: string | null;
  lastStreamAt: string | null;
  streamCategory: string | null;
  scheduledStartAt: string | null;
  streamTags: string[];
  videoProfile: Record<string, unknown>;
  audioProfile: Record<string, unknown>;
  encoderProfile: Record<string, unknown>;
  networkTest: Record<string, unknown>;
  connectionQuality: string | null;
  latencyMode: string | null;
  connectionStatus: StreamingConnectionStatus;
  selectedForToday: boolean;
  lastCheckedAt: string | null;
  lastSuccessfulTestAt: string | null;
  lastErrorMessage: string | null;
  oauthStatus: string;
  permissionStatus: string;
  quotaStatus: string;
  livePermissionStatus: string;
  rtmpStatus: string;
  destinationStatus: string;
  validationStatus: "not_validated" | "ready" | "needs_attention" | "error";
  validationReason: string | null;
  validationChecksJson: Array<Record<string, unknown>>;
  lastValidatedAt: string | null;
  lastSuccessfulValidationAt: string | null;
  lastValidationError: string | null;
  websiteName: string | null;
  websiteUrl: string | null;
  streamPageUrl: string | null;
  embedMethod: "iframe" | "link" | null;
  liveStatus: StreamingLiveStatus;
  broadcastExternalId: string | null;
  liveStartedAt: string | null;
  liveStoppedAt: string | null;
  liveDurationSeconds: number | null;
  streamTitle: string;
  streamDescription: string;
  privacy: string;
  thumbnailUrl: string;
  settings: Record<string, unknown>;
};

export type StreamingEncoderDetectResult = {
  detectedEncoders: ("nvenc" | "quicksync" | "amf" | "x264")[];
  recommended: "nvenc" | "quicksync" | "amf" | "x264";
  gpuName: string | null;
  cpuName: string | null;
  av1Supported: boolean;
};

export type StreamingPreviewStats = {
  online: boolean;
  message: string;
  droppedFrames: number;
  currentBitrateKbps: number;
  currentFps: number;
  encoderUsagePercent: number;
  gpuUsagePercent: number;
  cpuUsagePercent: number;
  networkThroughputMbps: number;
  audioLevels: { left: number; right: number };
};

export type StreamingWizardDefaults = {
  streamTitle: string;
  streamDescription: string;
  scheduledStartAt: string | null;
  category: string;
  privacy: string;
  tags: string[];
  churchWebsite: ChurchWebsiteSettings;
};

export type StreamingWizardReadinessCheck = {
  ok: boolean;
  message: string;
};

export type StreamingWizardReadiness = {
  ready: boolean;
  checks: {
    tokenEncryption: StreamingWizardReadinessCheck;
  };
};

export type StreamingWizardSaveInput = {
  destinationId: string;
  streamTitle?: string;
  streamDescription?: string;
  streamCategory?: string;
  privacy?: string;
  thumbnailUrl?: string;
  scheduledStartAt?: string | null;
  streamTags?: string[];
  videoProfile?: Record<string, unknown>;
  audioProfile?: Record<string, unknown>;
  encoderProfile?: Record<string, unknown>;
  networkTest?: Record<string, unknown>;
  connectionQuality?: string;
  latencyMode?: string;
  selectedForToday?: boolean;
  markReady?: boolean;
};

export type StreamingValidationSeverity = "info" | "warning" | "critical";
export type StreamingValidationStatus = "ready" | "needs_attention" | "error";

export type StreamingValidationCheck = {
  key: string;
  label: string;
  ok: boolean;
  message: string;
  severity: StreamingValidationSeverity;
};

export type StreamingValidationResult = {
  ok: boolean;
  status: StreamingValidationStatus;
  checks: StreamingValidationCheck[];
  safeUserMessage: string;
  technicalError?: string;
};

export type StreamingTestStep = {
  key?: string;
  label: string;
  ok: boolean;
  message?: string;
  severity?: StreamingValidationSeverity;
};

export type StreamingTestResult = {
  success: boolean;
  connectionStatus: StreamingConnectionStatus;
  message: string;
  steps: StreamingTestStep[];
  validation?: StreamingValidationResult;
};

export type StreamingOAuthStartResult = {
  configured: boolean;
  authorizationUrl: string | null;
  developmentMessage: string | null;
};

export type StreamingGoLiveDestinationResult = {
  id: string;
  platform: string;
  displayName: string;
  success: boolean;
  message: string;
};

export type StreamingGoLiveResult = {
  ready: StreamingGoLiveDestinationResult[];
  needsAttention: StreamingGoLiveDestinationResult[];
  canProceed: boolean;
};

export type StreamingStopDestinationResult = {
  id: string;
  platform: string;
  displayName: string;
  success: boolean;
  message: string;
  liveStatus: StreamingLiveStatus;
};

export type StreamingStopAllResult = {
  success: boolean;
  message: string;
  destinations: StreamingStopDestinationResult[];
  stoppedAt: string;
};

export type CreateStreamingDestinationInput = {
  platform: StreamingPlatform;
  displayName?: string;
  settings?: Record<string, unknown>;
  streamUrl?: string;
  streamKey?: string;
  backupStreamUrl?: string;
};

export type ChurchWebsiteSettings = {
  websiteName: string;
  streamPageUrl: string;
  embedMethod: string;
};

export type CustomRtmpSettings = {
  serverName: string;
  streamUrl: string;
  streamKey: string;
  backupStreamUrl?: string;
};
