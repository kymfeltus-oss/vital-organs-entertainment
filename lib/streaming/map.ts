import type { StreamingDestination } from "@/lib/todays-service/types";
import { normalizePlatform, platformMeta } from "@/lib/streaming/platforms";
import type { StreamingConnectionStatus, StreamingDestinationPublic } from "@/lib/streaming/types";

export function toPublicStreamingDestination(row: StreamingDestination): StreamingDestinationPublic {
  const platform = normalizePlatform(row.platform);
  const meta = platformMeta(String(platform));
  return {
    id: row.id,
    platform: String(platform),
    displayName: row.destinationName || meta?.label || String(platform),
    accountName: row.accountName,
    channelId: row.channelId,
    channelName: row.channelName,
    profileImageUrl: row.profileImageUrl,
    lastAuthenticatedAt: row.lastAuthenticatedAt,
    lastStreamAt: row.lastStreamAt,
    streamCategory: row.streamCategory,
    scheduledStartAt: row.scheduledStartAt,
    streamTags: row.streamTags,
    videoProfile: row.videoProfileJson,
    audioProfile: row.audioProfileJson,
    encoderProfile: row.encoderProfileJson,
    networkTest: row.networkTestJson,
    connectionQuality: row.connectionQuality,
    latencyMode: row.latencyMode,
    connectionStatus: row.connectionStatus,
    selectedForToday: row.selectedForToday,
    lastCheckedAt: row.lastCheckedAt,
    lastSuccessfulTestAt: row.lastSuccessfulTestAt,
    lastErrorMessage: row.lastErrorMessage,
    oauthStatus: row.oauthStatus,
    permissionStatus: row.permissionStatus,
    quotaStatus: row.quotaStatus,
    livePermissionStatus: row.livePermissionStatus,
    rtmpStatus: row.rtmpStatus,
    destinationStatus: row.destinationStatus,
    validationStatus: row.validationStatus,
    validationReason: row.validationReason,
    validationChecksJson: row.validationChecksJson,
    lastValidatedAt: row.lastValidatedAt,
    lastSuccessfulValidationAt: row.lastSuccessfulValidationAt,
    lastValidationError: row.lastValidationError,
    websiteName: row.websiteName,
    websiteUrl: row.websiteUrl,
    streamPageUrl: row.streamPageUrl,
    embedMethod: row.embedMethod,
    liveStatus: row.liveStatus,
    broadcastExternalId: row.broadcastExternalId,
    liveStartedAt: row.liveStartedAt,
    liveStoppedAt: row.liveStoppedAt,
    liveDurationSeconds: row.liveDurationSeconds,
    streamTitle: row.streamTitle,
    streamDescription: row.streamDescription,
    privacy: row.privacy,
    thumbnailUrl: row.thumbnailUrl,
    settings: row.settingsJson,
  };
}

export function legacyConnectionStatus(
  connected: boolean,
  status: string,
): StreamingConnectionStatus {
  if (connected && status === "ready") return "ready";
  if (connected) return "connected";
  if (status === "needs_attention") return "needs_attention";
  if (status === "not_connected") return "not_connected";
  return "not_connected";
}
