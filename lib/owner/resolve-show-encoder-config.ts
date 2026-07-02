import { isValidHlsUrl } from "@/lib/live/hls";
import {
  resolveAttendeePlaybackFromEnv,
  resolvePrimaryAttendeePlaybackFromEnv,
} from "@/lib/live/manifest-dev-fallback";
import { RESTREAM_RTMP_SERVER_DEFAULT } from "@/lib/owner/broadcast-engine-fallbacks";
import { resolveExternalIngestCredentials } from "@/lib/owner/resolve-external-ingest-credentials";
import { buildPrimaryRtmpIngestUrl } from "@/lib/stream-keys";

export type ShowEncoderConfig = {
  rtmpServer: string;
  streamKey: string;
  hlsPlaybackUrl: string | null;
};

/** Env defaults for Restream encoder fields (server-side only). */
export function resolveDefaultEncoderConfigFromEnv(): ShowEncoderConfig {
  const external = resolveExternalIngestCredentials();
  const hlsFromEnv =
    resolvePrimaryAttendeePlaybackFromEnv() ?? resolveAttendeePlaybackFromEnv();

  return {
    rtmpServer: external.rtmpUrl ?? RESTREAM_RTMP_SERVER_DEFAULT,
    streamKey: external.streamKey ?? "",
    hlsPlaybackUrl: hlsFromEnv && isValidHlsUrl(hlsFromEnv) ? hlsFromEnv : null,
  };
}

export function mergeEncoderConfigFields(
  stored: {
    primaryIngestEndpoint?: string;
    streamKey?: string;
    attendeePlaybackHlsUrl?: string;
  },
  defaults: ShowEncoderConfig = resolveDefaultEncoderConfigFromEnv(),
): ShowEncoderConfig {
  const rtmpServer = stored.primaryIngestEndpoint?.trim() || defaults.rtmpServer;
  const streamKey = stored.streamKey?.trim() || defaults.streamKey;
  const hlsRaw = stored.attendeePlaybackHlsUrl?.trim() || defaults.hlsPlaybackUrl || "";
  const hlsPlaybackUrl = hlsRaw && isValidHlsUrl(hlsRaw) ? hlsRaw : defaults.hlsPlaybackUrl;

  return { rtmpServer, streamKey, hlsPlaybackUrl };
}

export function buildRtmpIngestUrlFromEncoderConfig(config: ShowEncoderConfig): string | null {
  if (!config.streamKey.trim()) return null;
  return buildPrimaryRtmpIngestUrl(config.streamKey, config.rtmpServer);
}

const SHOW_SETUP_PRESET_KEY = "show_setup";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Read saved encoder fields from stream row presets — no DB writes (safe for snapshot poll). */
export function readEncoderConfigFromStreamPresets(
  presets: Record<string, unknown> | null | undefined,
): ShowEncoderConfig {
  const storedSetup = asRecord(asRecord(presets)[SHOW_SETUP_PRESET_KEY]);
  return mergeEncoderConfigFields(
    {
      primaryIngestEndpoint:
        typeof storedSetup.primaryIngestEndpoint === "string"
          ? storedSetup.primaryIngestEndpoint
          : undefined,
      streamKey: typeof storedSetup.streamKey === "string" ? storedSetup.streamKey : undefined,
      attendeePlaybackHlsUrl:
        typeof storedSetup.attendeePlaybackHlsUrl === "string"
          ? storedSetup.attendeePlaybackHlsUrl
          : undefined,
    },
  );
}
