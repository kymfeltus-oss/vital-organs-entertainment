import { isValidHlsUrl } from "@/lib/live/hls";
import { isAmazonIvsPlaybackUrl } from "@/lib/live/ivs-playback-url";
import { fetchManifestStreamConfig } from "@/lib/live/fetch-manifest-stream-config";
import { readLivLiveKitBroadcastState } from "@/lib/enterprise/liv-golf/livekit-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import type { PublishMode } from "@/lib/owner/contracts";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";

export type ManifestCarrier = "restream";

export type ResolvedManifestPlayback = {
  playbackUrl: string | null;
  activeSource: "primary";
  fromDatabase: boolean;
  selectedShowId: string;
  streamIsLive: boolean;
};

export function resolveManifestCarrier(_activeSource: "primary" | "backup"): ManifestCarrier {
  return "restream";
}

/** Attendee HLS for /api/stream/manifest — Restream-only. */
function readSavedSetupHlsUrl(presets: Record<string, unknown> | null | undefined): string | null {
  const root = presets && typeof presets === "object" ? presets : {};
  const setup =
    root.show_setup && typeof root.show_setup === "object"
      ? (root.show_setup as Record<string, unknown>)
      : {};
  const saved =
    typeof setup.attendeePlaybackHlsUrl === "string"
      ? setup.attendeePlaybackHlsUrl.trim()
      : "";

  return saved && isValidHlsUrl(saved) ? saved : null;
}

function readLiveKitHlsManifestUrl(
  presets: Record<string, unknown> | null | undefined,
): string | null {
  const state = readLivLiveKitBroadcastState(presets);
  const url = state?.hlsManifestUrl?.trim() ?? "";
  return url && isValidHlsUrl(url) ? url : null;
}

function isStaleIvsManifestUrl(
  url: string | null | undefined,
  publishMode: PublishMode | null,
): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  return publishMode === "livekit_hls" && isAmazonIvsPlaybackUrl(trimmed);
}

function pickManifestPlaybackUrl(input: {
  publishMode: PublishMode | null;
  livekitHlsUrl: string | null;
  primaryPlaybackUrl: string | null;
  playbackUrl: string | null;
  savedSetupHlsUrl: string | null;
}): string | null {
  const candidates = [
    input.publishMode === "livekit_hls" ? input.livekitHlsUrl : null,
    input.primaryPlaybackUrl,
    input.playbackUrl,
    input.savedSetupHlsUrl,
  ]
    .map((candidate) => candidate?.trim() ?? "")
    .filter((candidate) => candidate.length > 0)
    .filter((candidate) => !isStaleIvsManifestUrl(candidate, input.publishMode));

  return candidates.find((candidate) => isValidHlsUrl(candidate)) ?? null;
}

export async function resolveLiveManifestPlayback(): Promise<ResolvedManifestPlayback> {
  const admin = getSupabaseAdmin();
  const { config } = await fetchManifestStreamConfig(admin);

  if (!config?.is_live) {
    return {
      playbackUrl: null,
      activeSource: "primary",
      fromDatabase: false,
      selectedShowId: LIVE_STREAM_STATE_ID,
      streamIsLive: false,
    };
  }

  const { row } = await loadOwnerStreamState(admin);
  const savedSetupHlsUrl = readSavedSetupHlsUrl(row?.audio_master_presets);
  const publishMode = row?.publish_mode ?? null;
  const livekitHlsUrl = readLiveKitHlsManifestUrl(row?.audio_master_presets);

  const playbackUrl = pickManifestPlaybackUrl({
    publishMode,
    livekitHlsUrl,
    primaryPlaybackUrl: config.primary_playback_url,
    playbackUrl: config.playback_url,
    savedSetupHlsUrl,
  });

  if (playbackUrl && isValidHlsUrl(playbackUrl)) {
    return {
      playbackUrl,
      activeSource: "primary",
      fromDatabase: Boolean(config.primary_playback_url || config.playback_url || savedSetupHlsUrl),
      selectedShowId: row?.id ?? LIVE_STREAM_STATE_ID,
      streamIsLive: true,
    };
  }

  return {
    playbackUrl: null,
    activeSource: "primary",
    fromDatabase: false,
    selectedShowId: row?.id ?? LIVE_STREAM_STATE_ID,
    streamIsLive: true,
  };
}
