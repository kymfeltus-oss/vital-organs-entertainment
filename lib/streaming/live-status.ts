/** Canonical live_status values for public.streaming_destinations */
export const STREAMING_LIVE_STATUSES = [
  "offline",
  "validating",
  "ready",
  "needs_attention",
  "preparing",
  "live",
  "stopping",
  "error",
] as const;

export type StreamingLiveStatus = (typeof STREAMING_LIVE_STATUSES)[number];

export const STREAMING_LIVE_STATUS_DEFAULT: StreamingLiveStatus = "offline";

const LEGACY_LIVE_STATUS_MAP: Record<string, StreamingLiveStatus> = {
  connecting: "preparing",
  connected: "ready",
  preparing_broadcast: "preparing",
  going_live: "preparing",
};

export function isStreamingLiveStatus(value: string): value is StreamingLiveStatus {
  return (STREAMING_LIVE_STATUSES as readonly string[]).includes(value);
}

export function normalizeStreamingLiveStatus(
  value: string | null | undefined,
  fallback: StreamingLiveStatus = STREAMING_LIVE_STATUS_DEFAULT,
): StreamingLiveStatus {
  if (!value) return fallback;
  const lower = value.trim().toLowerCase();
  if (isStreamingLiveStatus(lower)) return lower;
  return LEGACY_LIVE_STATUS_MAP[lower] ?? fallback;
}

export function assertStreamingLiveStatus(
  value: string | null | undefined,
  fallback: StreamingLiveStatus = STREAMING_LIVE_STATUS_DEFAULT,
): StreamingLiveStatus {
  const normalized = normalizeStreamingLiveStatus(value, fallback);
  if (value && value !== normalized && !isStreamingLiveStatus(value)) {
    console.warn("[streaming_destinations] live_status coerced", {
      attempted: value,
      normalized,
    });
  }
  return normalized;
}

/** Destination is actively broadcasting or winding down. */
export function isMidBroadcastLiveStatus(status: StreamingLiveStatus): boolean {
  return status === "live" || status === "preparing";
}

/** Destination should be stopped during Stop Service. */
export function shouldStopStreamingLiveStatus(status: StreamingLiveStatus): boolean {
  return status === "live" || status === "preparing" || status === "stopping";
}

/** Destination is in a transient setup/validation state. */
export function isTransientStreamingLiveStatus(status: StreamingLiveStatus): boolean {
  return status === "validating" || status === "preparing" || status === "stopping";
}
