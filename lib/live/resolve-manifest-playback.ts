import { isValidHlsUrl } from "@/lib/live/hls";
import { fetchManifestStreamConfig } from "@/lib/live/fetch-manifest-stream-config";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
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

  const playbackUrl =
    [config.primary_playback_url, config.playback_url, savedSetupHlsUrl]
      .map((candidate) => candidate?.trim() ?? "")
      .find((candidate) => candidate && isValidHlsUrl(candidate)) || null;

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
