export type InternetConnectionType = "wifi" | "ethernet" | "cellular" | "manual" | "unknown";

export type InternetConnectionStatus =
  | "not_connected"
  | "connected"
  | "ready"
  | "needs_attention"
  | "error"
  | "unknown";

export type StreamingQuality = "excellent" | "good" | "fair" | "poor" | "offline" | "unknown";

export type WiFiNetwork = {
  ssid: string;
  signalStrength: number | null;
  secured: boolean;
};

export type InternetDetectResult = {
  online: boolean;
  connectionType: InternetConnectionType | null;
  ssid: string | null;
  localIp: string | null;
  internetReachable: boolean;
  ethernetConnected: boolean | null;
  agentAvailable: boolean;
};

export type InternetSpeedTestResult = {
  success: boolean;
  uploadMbps: number;
  downloadMbps: number;
  latencyMs: number;
  jitterMs?: number;
  packetLossPercent?: number;
  stabilityScore: number;
  streamingQuality: StreamingQuality;
  message: string;
};

export type PreferredChurchNetwork = {
  type: InternetConnectionType;
  ssid: string | null;
  remember: boolean;
};

export type InternetSetupSaveInput = {
  connectionName: string;
  isBackup?: boolean;
  connectionType: InternetConnectionType;
  ssid?: string | null;
  localIp?: string | null;
  uploadMbps?: number;
  downloadMbps?: number;
  latencyMs?: number;
  stabilityScore?: number;
  streamingQuality?: StreamingQuality;
};
