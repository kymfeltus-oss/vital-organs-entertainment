import { isValidRtmpUrl, resolveRtmpIngestUrlStatus } from "@/lib/live/rtmp";

function envRtmpIngestUrl(name: "PRIMARY_RTMP_INGEST_URL" | "BACKUP_RTMP_INGEST_URL"): string | null {
  const value = process.env[name]?.trim();
  return isValidRtmpUrl(value) ? value : null;
}

export function resolveStoredRtmpIngestUrl(
  stored: string | null | undefined,
  envFallback: "PRIMARY_RTMP_INGEST_URL" | "BACKUP_RTMP_INGEST_URL",
): string | null {
  const trimmed = stored?.trim() ?? "";
  if (isValidRtmpUrl(trimmed)) return trimmed;
  return envRtmpIngestUrl(envFallback);
}

export function buildRtmpIngestFields(
  primaryStored: string | null | undefined,
  backupStored: string | null | undefined,
) {
  const primaryRtmpIngestUrl = resolveStoredRtmpIngestUrl(
    primaryStored,
    "PRIMARY_RTMP_INGEST_URL",
  );
  const backupRtmpIngestUrl = resolveStoredRtmpIngestUrl(
    backupStored,
    "BACKUP_RTMP_INGEST_URL",
  );
  const primaryRtmpIngestUrlStatus = resolveRtmpIngestUrlStatus(primaryRtmpIngestUrl);
  const backupRtmpIngestUrlStatus = resolveRtmpIngestUrlStatus(backupRtmpIngestUrl);

  return {
    primaryRtmpIngestUrl,
    backupRtmpIngestUrl,
    primaryRtmpIngestUrlStatus,
    backupRtmpIngestUrlStatus,
    primaryRtmpConfigured: primaryRtmpIngestUrlStatus === "valid",
    backupRtmpConfigured: backupRtmpIngestUrlStatus === "valid",
  };
}
