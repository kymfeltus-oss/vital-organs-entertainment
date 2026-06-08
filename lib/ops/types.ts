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
