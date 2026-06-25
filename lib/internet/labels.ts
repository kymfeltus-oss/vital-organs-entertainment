import type { StreamingQuality } from "@/lib/internet/types";

/** Copy distinguishing OS-provided internet from Parable-saved configuration. */
export const INTERNET_UI = {
  availableTitle: "Internet Available",
  availableSubtitle: "Connected through your computer's current network.",
  speedTestNote:
    "This speed test measures your computer's current internet connection—not a network Parable configured.",
  noInternetTitle: "No Internet Connection Detected",
  noInternetBody:
    "Connect using your computer's network settings, then try again.",
  noInternetWindows: "Windows: Settings → Network & Internet",
  noInternetMac: "macOS: System Settings → Wi-Fi or Network",
  saveNetwork: "Save This Network",
  savedInParable: "Saved in Parable",
  usingCurrentNetwork: "Using Current Network",
  detecting: "Checking whether your computer has internet access…",
  testingTitle: "Testing Your Connection",
  testingLead: "Measuring your computer's current internet connection…",
} as const;

export function streamingQualityLabel(quality: StreamingQuality): string {
  switch (quality) {
    case "excellent":
      return "Excellent for streaming";
    case "good":
      return "Good for streaming";
    case "fair":
      return "Fair — may need backup internet";
    case "poor":
      return "Poor — backup internet recommended";
    case "offline":
      return "No internet detected";
    default:
      return "Checking…";
  }
}

export function connectionTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "wifi":
      return "Wi-Fi";
    case "ethernet":
      return "Ethernet";
    case "cellular":
      return "Cellular";
    case "manual":
      return "Manual";
    case "unknown":
      return "Unknown";
    default:
      return "Unknown";
  }
}

export function formatMbps(value: number | null | undefined): string {
  if (value == null || value <= 0) return "—";
  return `${Math.round(value * 10) / 10} Mbps`;
}

export function formatLatency(value: number | null | undefined): string {
  if (value == null || value <= 0) return "—";
  return `${Math.round(value)} ms`;
}
