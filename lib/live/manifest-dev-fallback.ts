import { isValidHlsUrl } from "@/lib/live/hls";
import {
  logPlaybackValidationWarnings,
  sanitizeAttendeePlaybackUrl,
  validateAttendeePlaybackUrl,
} from "@/lib/live/playback-url-validation";

/** Legacy Mux test stream — never serve to attendees. */
const LEGACY_MUX_DEMO_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const ENV_PLAYBACK_KEYS = [
  "ATTENDEE_PLAYBACK_HLS_URL",
  "NEXT_PUBLIC_HLS_STREAM_URL",
] as const;

let manifestEnvRoutingLogged = false;

/** Strip whitespace and accidental wrapping quotes from dotenv values. */
export function normalizeEnvPlaybackString(raw: string | undefined): string {
  let value = raw?.trim() ?? "";

  while (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

function logManifestEnvRoutingCheck(): void {
  if (manifestEnvRoutingLogged) return;
  manifestEnvRoutingLogged = true;

  const attendeeRaw = process.env.ATTENDEE_PLAYBACK_HLS_URL;
  const publicRaw = process.env.NEXT_PUBLIC_HLS_STREAM_URL;
  const attendee = normalizeEnvPlaybackString(attendeeRaw);
  const publicUrl = normalizeEnvPlaybackString(publicRaw);

  const attendeeValidation = attendee
    ? validateAttendeePlaybackUrl(attendee, "ATTENDEE_PLAYBACK_HLS_URL")
    : null;
  const publicValidation = publicUrl
    ? validateAttendeePlaybackUrl(publicUrl, "NEXT_PUBLIC_HLS_STREAM_URL")
    : null;

  if (attendeeValidation) logPlaybackValidationWarnings(attendeeValidation, "env_startup");
  if (publicValidation) logPlaybackValidationWarnings(publicValidation, "env_startup");

  const resolved = resolveAttendeePlaybackFromEnv();

  console.log(
    "[stream/manifest] Env routing check",
    attendee || publicUrl ? "CONFIGURED" : "EMPTY",
    {
      attendeeDefined: Boolean(attendeeRaw?.trim()),
      publicDefined: Boolean(publicRaw?.trim()),
      attendeePassesValidation: attendeeValidation?.ok ?? false,
      publicPassesValidation: publicValidation?.ok ?? false,
      resolvedPlaybackUrl: resolved,
    },
  );

  if ((attendeeRaw?.trim() || publicRaw?.trim()) && !resolved) {
    console.error(
      "[stream/manifest] Playback env is set but invalid. Use a Restream/CDN .m3u8 URL in ATTENDEE_PLAYBACK_HLS_URL, then restart the dev server.",
    );
  }
}

/** ATTENDEE_PLAYBACK_HLS_URL only — highest-priority env lane for production. */
export function resolvePrimaryAttendeePlaybackFromEnv(): string | null {
  return sanitizeAttendeePlaybackUrl(
    normalizeEnvPlaybackString(process.env.ATTENDEE_PLAYBACK_HLS_URL),
    "ATTENDEE_PLAYBACK_HLS_URL",
  );
}

/** Production HLS from env — ATTENDEE_PLAYBACK_HLS_URL first, then NEXT_PUBLIC_HLS_STREAM_URL. */
export function resolveAttendeePlaybackFromEnv(): string | null {
  logManifestEnvRoutingCheck();

  const configuredAttendee = resolveConfiguredAttendeePlaybackFromEnv();
  if (configuredAttendee) return configuredAttendee;

  return sanitizeAttendeePlaybackUrl(
    normalizeEnvPlaybackString(process.env.NEXT_PUBLIC_HLS_STREAM_URL),
    "NEXT_PUBLIC_HLS_STREAM_URL",
  );
}

export function hasAttendeePlaybackEnvConfigured(): boolean {
  return ENV_PLAYBACK_KEYS.some((key) => {
    const normalized = normalizeEnvPlaybackString(process.env[key]);
    return normalized.length > 0;
  });
}

export function isDemoManifestPlaybackUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  if (trimmed.includes("test-streams.mux.dev") || trimmed === LEGACY_MUX_DEMO_HLS) return true;
  const validation = validateAttendeePlaybackUrl(trimmed, "demo_check");
  return validation.ok === false && validation.reason === "known_demo_host";
}

/** Strip legacy demo/test manifests — returns null when URL is a demo stream. */
export function rejectDemoPlaybackUrl(url: string | null | undefined): string | null {
  return sanitizeAttendeePlaybackUrl(url, "playback_url");
}

export type ManifestExperienceKey =
  | "main_stage"
  | "crowd_xp"
  | "musician_xp"
  | "prayer_layer";

export type ManifestSuccessPayload = {
  success: true;
  playbackUrl: string;
  activeExperience: ManifestExperienceKey;
  activeSource: "primary" | "backup";
  /** Explicit false when serving configured production/env HLS (not Mux demo). */
  fallback?: boolean;
  fallbackReason?: string;
};

export function isAttendeePlaybackEnvPopulated(): boolean {
  return Boolean(normalizeEnvPlaybackString(process.env.ATTENDEE_PLAYBACK_HLS_URL));
}

/** ATTENDEE_PLAYBACK_HLS_URL when set — must pass .m3u8 + demo-host validation. */
export function resolveConfiguredAttendeePlaybackFromEnv(): string | null {
  return sanitizeAttendeePlaybackUrl(
    normalizeEnvPlaybackString(process.env.ATTENDEE_PLAYBACK_HLS_URL),
    "ATTENDEE_PLAYBACK_HLS_URL",
  );
}

/** @deprecated Demo manifest fallback removed — production/env URLs only. */
export function isDevMuxManifestFallbackEnabled(): boolean {
  return false;
}

export function isDevManifestFallbackEnabled(): boolean {
  return false;
}

/** Production env manifest — never flagged as demo fallback. */
export function buildProductionEnvManifestPayload(
  experience: ManifestExperienceKey,
): ManifestSuccessPayload | null {
  const playbackUrl = resolveAttendeePlaybackFromEnv();
  if (!playbackUrl) return null;

  return {
    success: true,
    playbackUrl,
    activeExperience: experience,
    activeSource: "primary",
    fallback: false,
  };
}

export function buildDevManifestFallbackPayload(
  experience: ManifestExperienceKey,
  _reason: string,
  _options?: { suppressDemoFallback?: boolean },
): ManifestSuccessPayload | null {
  return buildProductionEnvManifestPayload(experience);
}

/** @internal re-export for tests */
export { isValidHlsUrl };
