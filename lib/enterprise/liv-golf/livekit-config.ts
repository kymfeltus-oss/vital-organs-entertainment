import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

export type LiveKitCoreConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export type LiveKitServerConfig = LiveKitCoreConfig & {
  bucket: string;
  region: string;
  cdnBase: string | null;
  awsAccessKey: string;
  awsSecretKey: string;
};

export class LiveKitConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveKitConfigError";
  }
}

export function normalizeLiveKitHttpUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}

export function normalizeLiveKitWsUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
}

export function resolveLiveKitCoreConfig(): LiveKitCoreConfig {
  const rawUrl = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!rawUrl) throw new LiveKitConfigError("LIVEKIT_URL is not configured.");
  if (!apiKey) throw new LiveKitConfigError("LIVEKIT_API_KEY is not configured.");
  if (!apiSecret) throw new LiveKitConfigError("LIVEKIT_API_SECRET is not configured.");

  return {
    url: normalizeLiveKitHttpUrl(rawUrl),
    apiKey,
    apiSecret,
  };
}

/** Full LiveKit + S3 config — required only for HLS egress (Open to Fans). */
export function resolveLiveKitServerConfig(): LiveKitServerConfig {
  const core = resolveLiveKitCoreConfig();
  const bucket = process.env.LIV_GOLF_BROADCAST_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || "us-east-1";
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID?.trim();
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const cdnBase = process.env.LIV_GOLF_BROADCAST_CDN_BASE?.trim() || null;

  if (!bucket) throw new LiveKitConfigError("LIV_GOLF_BROADCAST_BUCKET is not configured.");
  if (!awsAccessKey || !awsSecretKey) {
    throw new LiveKitConfigError("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for HLS egress.");
  }

  return {
    ...core,
    bucket,
    region,
    cdnBase,
    awsAccessKey,
    awsSecretKey,
  };
}

export function resolveLivGolfLiveKitRoomName(roomId?: string | null): string {
  const trimmed = roomId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : LIV_GOLF_TOUR_MAIN_ROOM;
}

export function buildEgressFilenamePrefix(roomName: string, sessionStamp: string): string {
  const safeRoom = roomName.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `liv-golf/${safeRoom}/${sessionStamp}/`;
}

export function buildHlsManifestUrl(filenamePrefix: string, config: LiveKitServerConfig): string {
  const normalizedPrefix = filenamePrefix.endsWith("/") ? filenamePrefix : `${filenamePrefix}/`;
  const playlist = `${normalizedPrefix}playlist.m3u8`;

  if (config.cdnBase) {
    return `${config.cdnBase.replace(/\/$/, "")}/${playlist}`;
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${playlist}`;
}

export function resolvePublicLiveKitWsUrl(config: LiveKitCoreConfig): string {
  const raw = process.env.LIVEKIT_URL?.trim() ?? config.url;
  return normalizeLiveKitWsUrl(raw);
}
