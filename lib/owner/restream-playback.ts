import { isValidHlsUrl } from "@/lib/live/hls";
import { resolvePrimaryAttendeePlaybackFromEnv } from "@/lib/live/manifest-dev-fallback";

export type RestreamPlaybackInputs = {
  primary_playback_url?: string | null;
  playback_url?: string | null;
  showSetupHlsUrl?: string | null;
};

/**
 * Single Restream HLS URL for attendee playback.
 * Priority: DB primary (go-live) → legacy playback_url → saved show-setup → env default.
 *
 * Go-live writes primary_playback_url explicitly; that must win over per-deployment
 * env defaults merged into show-setup (e.g. Mux on Vercel vs IVS in .env.local).
 */
export function resolveRestreamHlsUrl(inputs: RestreamPlaybackInputs = {}): string | null {
  const primary = inputs.primary_playback_url?.trim() ?? "";
  if (primary && isValidHlsUrl(primary)) return primary;

  const legacy = inputs.playback_url?.trim() ?? "";
  if (legacy && isValidHlsUrl(legacy)) return legacy;

  const setup = inputs.showSetupHlsUrl?.trim();
  if (setup && isValidHlsUrl(setup)) return setup;

  const env = resolvePrimaryAttendeePlaybackFromEnv();
  if (env) return env;

  return null;
}
