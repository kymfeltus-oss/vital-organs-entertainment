export type LiveHubSection =
  | "pre-live"
  | "stream-setup"
  | "vmix"
  | "restream"
  | "content"
  | "team"
  | "advanced";

export type CheckStatus = "pass" | "warn" | "fail" | "pending" | "unknown";

export type ReadinessCheckId =
  | "internet"
  | "upload_speed"
  | "stream_destination"
  | "encoder_vmix"
  | "recording"
  | "audio_input"
  | "camera_feeds"
  | "presentation"
  | "backup_systems";

export type ReadinessCheck = {
  id: ReadinessCheckId;
  label: string;
  status: CheckStatus;
  detail: string;
  lastUpdatedAt: string | null;
};

export type ChecklistPhaseId =
  | "system"
  | "content"
  | "team"
  | "final_review"
  | "go_live";

export type ChecklistPhase = {
  id: ChecklistPhaseId;
  label: string;
  complete: boolean;
};

export type PreviewTelemetry = {
  resolution: string;
  fps: number;
  bitrateKbps: number;
  durationLabel: string;
  qualityLabel: string;
  playbackUrl: string | null;
};

export type SafetyIssueSeverity = "critical" | "warning";

export type SafetyIssue = {
  id: string;
  severity: SafetyIssueSeverity;
  label: string;
  detail: string;
};

export type LiveHubSettings = {
  blockGoLiveWithoutRecording: boolean;
  blockGoLiveWithoutRestream: boolean;
};

export const DEFAULT_LIVE_HUB_SETTINGS: LiveHubSettings = {
  blockGoLiveWithoutRecording: false,
  blockGoLiveWithoutRestream: false,
};

export const LIVE_HUB_DESKTOP_MIN_WIDTH_PX = 1280;
