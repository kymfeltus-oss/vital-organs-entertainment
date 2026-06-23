import type { StudioEngineMode } from "@/lib/ops/studio-engine-mode";

export type StreamAccessLogRow = {
  id: string;
  user_id: string | null;
  result: string;
  reason: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

export type OpsSnapshot = {
  stream: {
    isLive: boolean;
    activeSource: string;
    primaryConfigured: boolean;
    backupConfigured: boolean;
    primaryPlaybackUrlStatus: "valid" | "invalid" | "missing";
    backupPlaybackUrlStatus: "valid" | "invalid" | "missing";
    primaryRtmpIngestUrl: string | null;
    backupRtmpIngestUrl: string | null;
    primaryRtmpIngestUrlStatus: "valid" | "invalid" | "missing";
    backupRtmpIngestUrlStatus: "valid" | "invalid" | "missing";
    primaryRtmpConfigured: boolean;
    backupRtmpConfigured: boolean;
    primaryRtmpPullUrl: string | null;
    backupRtmpPullUrl: string | null;
    cameraPreviewHlsUrl: string | null;
    primaryRtmpPullUrlStatus: "valid" | "invalid" | "missing";
    backupRtmpPullUrlStatus: "valid" | "invalid" | "missing";
    cameraPreviewHlsUrlStatus: "valid" | "invalid" | "missing";
    primaryRtmpPullConfigured: boolean;
    backupRtmpPullConfigured: boolean;
    cameraPreviewConfigured: boolean;
    storedRestreamOutputs: {
      pushConfigured: boolean;
      pullConfigured: boolean;
      previewConfigured: boolean;
      playbackConfigured: boolean;
      provisionedCount: number;
      totalLanes: 4;
    };
    studioEngineMode: StudioEngineMode;
    updatedAt: string;
    updatedBy: string | null;
  };
  realtime: {
    platformChannel: string;
    broadcastEvent: string;
    recentChatMessages10m: number;
    lastStreamStateSyncAt: string;
  };
  stripe: {
    paidOrdersLast24h: number;
    totalPaidOrders: number;
    lastPaidOrderAt: string | null;
  };
  metrics: {
    paidAttendees: number;
    harvestTotalCents: number;
    harvestGoalDollars: number;
    seedCoinsDistributed: number;
  };
  accessLogs: StreamAccessLogRow[];
};

export type OpsStreamAction = "go_live" | "switch_backup" | "emergency_offline";
