import { isAmazonIvsPlaybackUrl } from "@/lib/live/ivs-playback-url";

type LivShowSetupFields = {
  showTitle?: string;
  eventLocation?: string;
  targetDateTime?: string;
  scheduleTimezone?: string;
  primaryIngestEndpoint?: string;
  streamKey?: string;
  attendeePlaybackHlsUrl?: string;
  updatedAt?: string | null;
};

const VITAL_ORGANS_TEXT_PATTERNS = [
  /ian\s*craig/i,
  /300\s*awakening/i,
  /&300\b/i,
  /@\s*300\b/i,
  /\b300\b.*\bawakening\b/i,
  /vital\s*organs/i,
  /the\s*awakening\b/i,
  /you'?re\s+almost\s+live/i,
  /live\s+recording\s+experience/i,
  /new\s+orleans,\s*la/i,
  /^live\s+event$/i,
  /^host$/i,
  /dayspring\s*family\s*church/i,
];

function isVitalOrgansDefaultText(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return false;
  return VITAL_ORGANS_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function sanitizePlaybackHlsUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (isAmazonIvsPlaybackUrl(trimmed)) return "";
  return trimmed;
}

/** Strip shared Vital Organs / 300 Awakening defaults from LIV stream setup form fields. */
export function sanitizeLivShowSetupFields<T extends LivShowSetupFields>(state: T): T {
  return {
    ...state,
    showTitle:
      state.showTitle && !isVitalOrgansDefaultText(state.showTitle) ? state.showTitle.trim() : "",
    eventLocation:
      state.eventLocation && !isVitalOrgansDefaultText(state.eventLocation)
        ? state.eventLocation.trim()
        : "",
    attendeePlaybackHlsUrl: sanitizePlaybackHlsUrl(state.attendeePlaybackHlsUrl),
  };
}
