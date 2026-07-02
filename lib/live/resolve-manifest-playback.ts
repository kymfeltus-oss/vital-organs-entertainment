import { isValidHlsUrl } from "@/lib/live/hls";
import { fetchManifestStreamConfig } from "@/lib/live/fetch-manifest-stream-config";
import { readEncoderConfigFromStreamPresets } from "@/lib/owner/resolve-show-encoder-config";
import { resolveRestreamHlsUrl } from "@/lib/owner/restream-playback";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";

export type ManifestCarrier = "restream";

export type ResolvedManifestPlayback = {
  playbackUrl: string | null;
  activeSource: "primary";
  fromDatabase: boolean;
};

export function resolveManifestCarrier(_activeSource: "primary" | "backup"): ManifestCarrier {
  return "restream";
}

/** Attendee HLS for /api/stream/manifest — Restream-only. */
export async function resolveLiveManifestPlayback(): Promise<ResolvedManifestPlayback> {
  const admin = getSupabaseAdmin();
  const { config } = await fetchManifestStreamConfig(admin);

  if (!config?.is_live) {
    return { playbackUrl: null, activeSource: "primary", fromDatabase: false };
  }

  const { row } = await loadOwnerStreamState(admin);
  const encoder = readEncoderConfigFromStreamPresets(row?.audio_master_presets);

  const playbackUrl = resolveRestreamHlsUrl({
    showSetupHlsUrl: encoder.hlsPlaybackUrl,
    primary_playback_url: config.primary_playback_url,
    playback_url: config.playback_url,
  });

  if (playbackUrl && isValidHlsUrl(playbackUrl)) {
    return {
      playbackUrl,
      activeSource: "primary",
      fromDatabase: Boolean(config.primary_playback_url || config.playback_url),
    };
  }

  return { playbackUrl: null, activeSource: "primary", fromDatabase: false };
}
