/** Initial display buffer, gradually reduced while the attendee remains on the live page. */
export const LIVE_VIEWER_DISPLAY_BUFFER = 400;
export const LIVE_VIEWER_DISPLAY_TARGET = 85;
export const LIVE_VIEWER_DECAY_INTERVAL_MS = 2_000;
export const LIVE_VIEWER_DECAY_STEP = 1;

export const LIVE_VIEWER_PRESENCE_CHANNEL = "live-viewer-presence";

export function applyLiveViewerDisplayBuffer(
  actualCount: number,
  displayBuffer = LIVE_VIEWER_DISPLAY_BUFFER,
): number {
  const safeActual = Number.isFinite(actualCount) ? Math.max(0, actualCount) : 0;
  const safeBuffer = Number.isFinite(displayBuffer) ? Math.max(0, displayBuffer) : 0;
  return Math.round(safeActual + safeBuffer);
}

export function formatLiveViewerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 10_000) {
    return `${Math.round(count / 1_000)}K`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString();
}

const PRESENCE_SESSION_KEY = "live_viewer_presence_key";

/** Stable anonymous key when the viewer has no Supabase user id. */
export function resolveLiveViewerPresenceKey(userId: string | null): string {
  if (userId) return userId;

  if (typeof window === "undefined") {
    return "anonymous";
  }

  const existing = sessionStorage.getItem(PRESENCE_SESSION_KEY);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `anon_${crypto.randomUUID()}`
      : `anon_${Date.now().toString(36)}`;

  sessionStorage.setItem(PRESENCE_SESSION_KEY, created);
  return created;
}

export function countLiveViewerPresence(
  presenceState: Record<string, unknown[]>,
): number {
  return Object.keys(presenceState).length;
}
