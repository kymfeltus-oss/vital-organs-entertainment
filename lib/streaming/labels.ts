import type { StreamingConnectionStatus } from "@/lib/streaming/types";
import type { StreamingLiveStatus } from "@/lib/streaming/live-status";
import { normalizeStreamingLiveStatus } from "@/lib/streaming/live-status";

export function connectionStatusLabel(status: StreamingConnectionStatus | string): string {
  switch (status) {
    case "ready":
      return "Ready to Stream";
    case "connected":
      return "Connected";
    case "needs_attention":
      return "Needs Attention";
    case "error":
      return "Needs Attention";
    case "not_connected":
    default:
      return "Not Connected";
  }
}

export function liveStatusLabel(status: StreamingLiveStatus | string): string {
  const normalized = normalizeStreamingLiveStatus(typeof status === "string" ? status : status);
  switch (normalized) {
    case "validating":
      return "Validating…";
    case "ready":
      return "Ready to Stream";
    case "preparing":
      return "Preparing…";
    case "live":
      return "Live";
    case "stopping":
      return "Stopping…";
    case "needs_attention":
      return "Needs Attention";
    case "error":
      return "Error";
    case "offline":
    default:
      return "Offline";
  }
}

export function formatLastChecked(at: string | null): string {
  if (!at) return "Never checked";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(at));
  } catch {
    return "Unknown";
  }
}
