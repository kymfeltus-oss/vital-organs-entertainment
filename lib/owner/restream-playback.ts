import { isValidHlsUrl } from "@/lib/live/hls";
import { resolvePrimaryAttendeePlaybackFromEnv } from "@/lib/live/manifest-dev-fallback";

export type RestreamPlaybackInputs = {
  primary_playback_url?: string | null;
  playback_url?: string | null;
  showSetupHlsUrl?: string | null;
};

/**
 * Single Restream HLS URL for attendee playback.
 * Priority: saved show-setup → DB primary → legacy playback_url → env default.
 */
export function resolveRestreamHlsUrl(inputs: RestreamPlaybackInputs = {}): string | null {
  const setup = inputs.showSetupHlsUrl?.trim();
  if (setup && isValidHlsUrl(setup)) return setup;

  const primary = inputs.primary_playback_url?.trim() ?? "";
  if (primary && isValidHlsUrl(primary)) return primary;

  const legacy = inputs.playback_url?.trim() ?? "";
  if (legacy && isValidHlsUrl(legacy)) return legacy;

  const env = resolvePrimaryAttendeePlaybackFromEnv();
  if (env) return env;

  return null;
}
