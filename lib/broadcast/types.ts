/** PARABLE Broadcast Console — service-ready production contracts. */

// ---------------------------------------------------------------------------
// Core enums
// ---------------------------------------------------------------------------

export type SourceProtocol = "hdmi" | "ndi" | "srt" | "rtmp" | "webcam" | "unknown";

/** System state colors — GREEN / YELLOW / ORANGE / RED / BLACK */
export type HealthStatus = "green" | "yellow" | "orange" | "red" | "black";

export type AdapterConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type AdapterId = "vmix" | "obs" | "restream" | "youtube" | "facebook";

export type TransitionType = "cut" | "take" | "fade" | "stinger";

export type SourceCardStatus = "active" | "preview" | "idle" | "offline";

export type InternetStatus = "online" | "degraded" | "offline";

export type StreamPlatformId = "restream" | "youtube" | "facebook" | "custom_rtmp";

export type ProductionDataMode = "live" | "simulated" | "unavailable";

// ---------------------------------------------------------------------------
// Hardware & telemetry
// ---------------------------------------------------------------------------

export type HardwareSource = {
  id: string;
  name: string;
  protocol: SourceProtocol;
  online: boolean;
  lastHeartbeatAt: string | null;
  resolution: string | null;
  fps: number | null;
  signalStrength: number;
  isDark: boolean;
  isOverexposed: boolean;
  healthStatus: HealthStatus;
  adapterId: AdapterId | null;
  vmixInputNumber?: number;
};

export type AudioChannelTelemetry = {
  id: string;
  name: string;
  peakDb: number;
  rmsDb: number;
  volume: number;
  muted: boolean;
  clipping: boolean;
  silent: boolean;
  autoGain: boolean;
  meterLevel: number;
};

export type AudioTelemetry = {
  updatedAt: string;
  masterPeakDb: number;
  masterSilent: boolean;
  masterClipping: boolean;
  masterPresent: boolean;
  channels: AudioChannelTelemetry[];
  noiseFloorIssue: boolean;
  possibleFeedback: boolean;
};

export type StreamDestinationTelemetry = {
  id: StreamPlatformId;
  name: string;
  connected: boolean;
  live: boolean;
  bitrateKbps: number;
  latencyMs: number | null;
  droppedFrames: number;
  error: string | null;
};

export type StreamTelemetry = {
  updatedAt: string;
  bitrateKbps: number;
  droppedFrames: number;
  packetLossPercent: number;
  latencyMs: number | null;
  encoderOverloaded: boolean;
  pipelineAvailable: boolean;
  internetStatus: InternetStatus;
  /** When false, uplink bitrate trend is unstable (Event Guardian). */
  bitrateStable?: boolean;
  destinations: StreamDestinationTelemetry[];
};

// ---------------------------------------------------------------------------
// Readiness & safety
// ---------------------------------------------------------------------------

export type ReadinessFailure = {
  id: string;
  label: string;
  status: HealthStatus;
  message: string;
  hardBlock: boolean;
};

export type ReadinessReport = {
  timestamp: string;
  score: number;
  canGoLive: boolean;
  criticalFailures: ReadinessFailure[];
  warnings: ReadinessFailure[];
  hardBlocks: ReadinessFailure[];
  supervisorOverridePermitted: boolean;
};

export type ProductionSafetyAction = {
  id: string;
  category: "source" | "audio" | "stream" | "readiness" | "encoder";
  severity: HealthStatus;
  title: string;
  recommendation: string;
  relatedCheckId: string | null;
  executable: boolean;
  executed: boolean;
  /** PARABLE Event Guardian — plain-language issue (optional on legacy actions). */
  issue?: string;
  /** Operator-facing impact estimate. */
  estimatedImpact?: string;
  /** ISO timestamp when the recommendation was evaluated. */
  timestamp?: string;
  /** Event Guardian rule identifier when sourced from guardian pipeline. */
  ruleId?: string;
};

export type ProductionState = {
  previewSourceId: string | null;
  programSourceId: string | null;
  isLive: boolean;
  isRecording: boolean;
  lastTransition: TransitionType | null;
  stingerActive: boolean;
  fadeProgress: number;
  supervisorOverride: boolean;
  supervisorReason: string;
  storageAvailableGb: number;
};

export type AdapterConnectionMeta = {
  adapterId: AdapterId;
  connectionState: AdapterConnectionState;
  lastError: string | null;
  isAvailable: boolean;
};

import type { ProductionLogEntry, ProductionPipelineTrace } from "@/services/broadcast/ProductionLogService";

// ---------------------------------------------------------------------------
// Production store (UI + service boundary)
// ---------------------------------------------------------------------------

export type VmixAdapterHealthStatus = "connected" | "degraded" | "disconnected";

/** Optional v1.0 extension — vMix adapter health for telemetry tray. */
export type VmixAdapterHealthMeta = {
  status: VmixAdapterHealthStatus;
  pollLatencyMs: number | null;
  inputCount: number;
  lastSuccessfulPollAt: string | null;
  lastError: string | null;
};

/** Optional v1.0 extension — normalized record/stream execution flags. */
export type ProductionExecutionFlagsMeta = {
  recording: "active" | "off";
  stream: "live" | "standby";
};

export type ProductionStoreMeta = {
  hydratedAt: string;
  devMode: boolean;
  dataMode: ProductionDataMode;
  dataSourceLabel: string;
  adapterConnections: AdapterConnectionMeta[];
  pipelineTrace: ProductionPipelineTrace;
  /** Optional v1.0 extension — architecture version label for UI tray. */
  architectureVersion?: string;
  /** Optional v1.0 extension — vMix poll health snapshot. */
  vmixHealth?: VmixAdapterHealthMeta;
  /** Optional v1.0 extension — record/stream bus flags. */
  executionFlags?: ProductionExecutionFlagsMeta;
  /** Operator rehearsal flag — simulates go live without adapter streaming. */
  rehearsalMode?: boolean;
};

export type ProductionStore = {
  sources: HardwareSource[];
  previewSourceId: string | null;
  programSourceId: string | null;
  audioTelemetry: AudioTelemetry;
  streamTelemetry: StreamTelemetry;
  readinessReport: ReadinessReport;
  safetyActions: ProductionSafetyAction[];
  productionLog: ProductionLogEntry[];
  production: ProductionState;
  adapterConnectionStates: Record<AdapterId, AdapterConnectionMeta>;
  meta: ProductionStoreMeta;
};

export type { ProductionLogEntry, ProductionPipelineTrace };

// ---------------------------------------------------------------------------
// UI compatibility aliases (mapped from service types in ProductionBrain)
// ---------------------------------------------------------------------------

/** @deprecated Use SourceProtocol in new code */
export type SourceConnectionType = Exclude<SourceProtocol, "unknown">;

export type BroadcastSource = {
  id: string;
  name: string;
  connectionType: SourceConnectionType;
  online: boolean;
  isDark: boolean;
  isOverexposed: boolean;
  signalStrength: number;
  vmixInputNumber?: number;
  adapterSource?: AdapterId;
};

export type AudioChannel = {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  meterLevel: number;
  clipping: boolean;
  autoGain: boolean;
};

export type StreamDestination = {
  id: StreamPlatformId;
  name: string;
  connected: boolean;
  live: boolean;
  bitrateKbps: number;
  error: string | null;
};

/** Flattened check row for readiness / safety panels */
export type ReadinessCheck = {
  id: string;
  label: string;
  severity: HealthStatus;
  message: string;
  passed: boolean;
  blocksGoLive: boolean;
  hardBlock: boolean;
};

export type AddSourcePayload = {
  name: string;
  connectionType: SourceConnectionType;
};

export const HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  green: "Safe",
  yellow: "Warning",
  orange: "Action Required",
  red: "Critical",
  black: "Block Go Live",
};

/** @deprecated Use HEALTH_STATUS_LABEL */
export const READINESS_SEVERITY_LABEL = HEALTH_STATUS_LABEL;

export type ReadinessSeverity = HealthStatus;
