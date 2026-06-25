import type { MixerConnectionStatusDb, MixerConnectionTypeDb } from "@/lib/database/mixers";

export const DEFAULT_SERVICE_TENANT_ID = "300-awakening";

export type ReadinessStatus = "ready" | "needs_attention" | "not_connected" | "unknown";

export type SoundDeviceConnectionType =
  | "browser_microphone"
  | "usb_audio"
  | "audio_interface"
  | "network_mixer"
  | "manual"
  | "unknown";

/** @deprecated Discovery/agent — map with mapDiscoveredConnectionType before persisting */
export type SoundConnectionType =
  | "usb"
  | "ethernet_mixer"
  | "wasapi"
  | "coreaudio"
  | "asio"
  | "browser"
  | SoundDeviceConnectionType
  | "unknown";

export type SoundDeviceType =
  | "microphone"
  | "mixer"
  | "audio_interface"
  | "instrument_input"
  | "choir_group"
  | "band_group"
  | "manual";

export type SoundDeviceStatus =
  | "not_connected"
  | "connected"
  | "ready"
  | "needs_attention"
  | "error";

export type UploadStrength = "excellent" | "good" | "needs_attention" | "not_connected" | "unknown";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "open" | "ignored" | "fixed";
export type TeamRoleKey = "producer" | "sound" | "cameras" | "slides" | "pastor" | "volunteer";
export type SoundCategory =
  | "mixer"
  | "microphone"
  | "choir_mic"
  | "band_input"
  | "pastor_mic"
  | "livestream_audio"
  | "recording_audio"
  | "other";

export type ServiceRecord = {
  id: string;
  tenantId: string;
  serviceName: string;
  serviceDate: string;
  serviceStartTime: string;
  broadcastProfile: string;
  readinessMessage: string;
  countdownEnabled: boolean;
  serviceStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceEquipment = {
  id: string;
  tenantId: string;
  serviceId: string;
  equipmentType: string;
  name: string;
  configJson: Record<string, unknown>;
  status: ReadinessStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SoundLiveStatus =
  | "offline"
  | "connecting"
  | "connected"
  | "previewing"
  | "testing"
  | "needs_attention";

export type SoundItem = {
  id: string;
  tenantId: string;
  serviceId: string;
  category: SoundCategory;
  name: string;
  deviceName: string;
  deviceLabel: string | null;
  deviceType: SoundDeviceType;
  connectionType: SoundDeviceConnectionType;
  deviceId: string | null;
  hardwareLabel: string | null;
  deviceIndex: number | null;
  manufacturer: string | null;
  model: string | null;
  sampleRate: number | null;
  channelCount: number | null;
  signalPresent: boolean;
  peakLevel: number | null;
  averageLevel: number | null;
  clippingDetected: boolean;
  mixerType: string | null;
  mixerIp: string | null;
  lastTestedAt: string | null;
  lastTestAt: string | null;
  lastSuccessfulTestAt: string | null;
  lastConnectedAt: string | null;
  lastErrorMessage: string | null;
  liveStatus: SoundLiveStatus;
  healthJson: Record<string, unknown>;
  levelsJson: Record<string, unknown>;
  settingsJson: Record<string, unknown>;
  configJson: Record<string, unknown>;
  status: SoundDeviceStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MixerConnectionType = MixerConnectionTypeDb;

export type Mixer = {
  id: string;
  /** Church/tenant identifier (maps to tenant_id / church_id in DB) */
  tenantId: string;
  serviceId: string;
  soundItemId: string | null;
  name: string;
  /** Legacy slug e.g. behringer_x32 — kept for driver routing */
  mixerModel: string;
  manufacturer: string | null;
  model: string | null;
  /** @deprecated Prefer ethernetIpAddress */
  ipAddress: string;
  ethernetIpAddress: string | null;
  connectionType: MixerConnectionType;
  usbDeviceName: string | null;
  usbDeviceId: string | null;
  lastConnectionMethod: string | null;
  firmware: string | null;
  /** DB column: firmware_version */
  firmwareVersion: string | null;
  serialNumber: string | null;
  connectionStatus: MixerConnectionStatusDb;
  lastConnectedAt: string | null;
  lastTestAt: string | null;
  lastSuccessfulTestAt: string | null;
  lastErrorMessage: string | null;
  liveStatus: SoundLiveStatus;
  healthJson: Record<string, unknown>;
  sceneName: string | null;
  channelCount: number | null;
  sampleRate: number | null;
  importedSetupJson: Record<string, unknown> | null;
  connectionConfigJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Microphone = {
  id: string;
  tenantId: string;
  serviceId: string;
  soundItemId: string | null;
  name: string;
  micType: string;
  batteryPct: number | null;
  status: ReadinessStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Camera = {
  id: string;
  tenantId: string;
  serviceId: string;
  name: string;
  cameraType: string;
  location: string;
  previewSource: string;
  connectionType: import("@/lib/cameras/types").CameraConnectionType;
  deviceId: string | null;
  hardwareLabel: string | null;
  deviceIndex: number | null;
  networkUrl: string | null;
  networkUsername: string | null;
  manufacturer: string | null;
  model: string | null;
  lastTestAt: string | null;
  lastSuccessfulTestAt: string | null;
  lastErrorMessage: string | null;
  liveStatus: import("@/lib/cameras/types").CameraLiveStatus;
  settingsJson: Record<string, unknown>;
  status: ReadinessStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type InternetConnection = {
  id: string;
  tenantId: string;
  serviceId: string;
  connectionName: string;
  networkName: string;
  isBackup: boolean;
  isPrimary: boolean;
  connectionType: import("@/lib/internet/types").InternetConnectionType;
  ssid: string | null;
  localIp: string | null;
  uploadStrength: UploadStrength;
  status: import("@/lib/internet/types").InternetConnectionStatus;
  lastTestAt: string | null;
  lastTestedAt: string | null;
  lastConnectedAt: string | null;
  lastTestMbps: number | null;
  uploadMbps: number | null;
  downloadMbps: number | null;
  latencyMs: number | null;
  packetLossPercent: number | null;
  stabilityScore: number | null;
  streamingQuality: import("@/lib/internet/types").StreamingQuality | null;
  settingsJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ServiceBroadcastDestination = {
  id: string;
  tenantId: string;
  serviceId: string;
  platform: import("@/lib/streaming/types").StreamingPlatform;
  destinationId: string | null;
  displayOrder: number;
  enabled: boolean;
  connectedAccount: string | null;
  oauthStatus: string;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BroadcastDestinationCard = {
  platform: import("@/lib/streaming/types").StreamingPlatform;
  label: string;
  description: string;
  maxResolution: string;
  maxFps: number;
  features: { id: string; label: string }[];
  setupTimeLabel: string;
  recommended: boolean;
  selected: boolean;
  enabled: boolean;
  destinationId: string | null;
  connectedAccount: string | null;
  oauthStatus: string;
  connectionStatus: string;
  lastConnectedAt: string | null;
  lastTestedAt: string | null;
  health: import("@/lib/streaming/broadcast-catalog").DestinationHealth;
};

export type StreamingDestination = {
  id: string;
  tenantId: string;
  serviceId: string;
  destinationName: string;
  platform: string;
  accountName: string | null;
  accountEmail: string | null;
  channelId: string | null;
  channelName: string | null;
  profileImageUrl: string | null;
  oauthPermissionsJson: Record<string, unknown>;
  oauthExpiresAt: string | null;
  lastAuthenticatedAt: string | null;
  lastStreamAt: string | null;
  streamCategory: string | null;
  scheduledStartAt: string | null;
  streamTags: string[];
  videoProfileJson: Record<string, unknown>;
  audioProfileJson: Record<string, unknown>;
  encoderProfileJson: Record<string, unknown>;
  networkTestJson: Record<string, unknown>;
  connectionQuality: import("@/lib/internet/types").StreamingQuality | null;
  latencyMode: string | null;
  connectionStatus: import("@/lib/streaming/types").StreamingConnectionStatus;
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
  liveStatus: import("@/lib/streaming/types").StreamingLiveStatus;
  broadcastExternalId: string | null;
  liveStartedAt: string | null;
  liveStoppedAt: string | null;
  liveDurationSeconds: number | null;
  connected: boolean;
  privacy: string;
  streamTitle: string;
  streamDescription: string;
  thumbnailUrl: string;
  advancedJson: Record<string, unknown>;
  settingsJson: Record<string, unknown>;
  status: ReadinessStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RecordingSetting = {
  id: string;
  tenantId: string;
  serviceId: string;
  recordingEnabled: boolean;
  recordingName: string;
  saveLocation: string;
  storageRemainingGb: number | null;
  backupRecording: boolean;
  status: ReadinessStatus;
  createdAt: string;
  updatedAt: string;
};

export type PresentationSource = {
  id: string;
  tenantId: string;
  serviceId: string;
  softwareName: string;
  connectionStatus: string;
  lyricsLoaded: boolean;
  slidesLoaded: boolean;
  lowerThirdsEnabled: boolean;
  status: ReadinessStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServiceTimelineItem = {
  id: string;
  tenantId: string;
  serviceId: string;
  partKey: string;
  label: string;
  durationMinutes: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  id: string;
  tenantId: string;
  serviceId: string;
  name: string;
  roleKey: TeamRoleKey;
  email: string;
  phone: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ServiceAlert = {
  id: string;
  tenantId: string;
  serviceId: string;
  message: string;
  severity: AlertSeverity;
  category: string;
  status: AlertStatus;
  note: string;
  sourceRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SectionReadiness = {
  sound: ReadinessStatus;
  cameras: ReadinessStatus;
  internet: ReadinessStatus;
  livestream: ReadinessStatus;
  recording: ReadinessStatus;
  presentation: ReadinessStatus;
};

export type LiveReadinessState = {
  tenantId: string;
  serviceId: string;
  readinessPercent: number;
  sections: SectionReadiness;
  updatedAt: string;
};

export type TodaysServicePayload = {
  service: ServiceRecord;
  equipment: ServiceEquipment[];
  soundItems: SoundItem[];
  mixers: Mixer[];
  microphones: Microphone[];
  cameras: Camera[];
  internetConnections: InternetConnection[];
  streamingDestinations: StreamingDestination[];
  broadcastDestinations: ServiceBroadcastDestination[];
  broadcastDestinationCards: BroadcastDestinationCard[];
  recordingSettings: RecordingSetting[];
  presentationSources: PresentationSource[];
  timelineItems: ServiceTimelineItem[];
  teamMembers: TeamMember[];
  alerts: ServiceAlert[];
  readiness: LiveReadinessState;
  equipmentProfile: import("@/lib/todays-service/equipment-onboarding").TenantEquipmentProfile | null;
};

export type ServicePermissions = {
  canView: boolean;
  canEdit: boolean;
  canBeginService: boolean;
  canTest: boolean;
};

export type TestResult = {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
};

export type BeginServiceResult = {
  success: boolean;
  message: string;
  criticalIssues: string[];
  serviceStartedAt: string | null;
  redirectUrl: string | null;
  streamingGate?: import("@/lib/streaming/types").StreamingGoLiveResult | null;
};

export type StopServiceResult = {
  success: boolean;
  message: string;
  serviceStoppedAt: string | null;
  streaming: import("@/lib/streaming/types").StreamingStopAllResult;
  recordingStopped: boolean;
  encoderStopped: boolean;
};

export const DEFAULT_TIMELINE_PARTS: readonly { partKey: string; label: string }[] = [
  { partKey: "countdown", label: "Countdown" },
  { partKey: "welcome", label: "Welcome" },
  { partKey: "worship", label: "Worship" },
  { partKey: "announcements", label: "Announcements" },
  { partKey: "offering", label: "Offering" },
  { partKey: "sermon", label: "Sermon" },
  { partKey: "invitation", label: "Invitation" },
  { partKey: "closing", label: "Closing" },
  { partKey: "post_service", label: "Post Service" },
] as const;

export function statusLabel(status: ReadinessStatus | UploadStrength): string {
  switch (status) {
    case "ready":
    case "excellent":
      return "Ready";
    case "good":
      return "Good";
    case "needs_attention":
      return "Needs Attention";
    case "not_connected":
      return "Not Connected";
    default:
      return "Checking…";
  }
}

export function statusColorClass(status: ReadinessStatus | UploadStrength): string {
  switch (status) {
    case "ready":
    case "excellent":
    case "good":
      return "text-emerald-400";
    case "needs_attention":
      return "text-amber-400";
    case "not_connected":
      return "text-red-400";
    default:
      return "text-brand-muted";
  }
}
