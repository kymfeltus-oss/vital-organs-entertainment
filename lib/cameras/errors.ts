export function plainEnglishCameraError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const lower = raw.toLowerCase();

  if (lower.includes("notallowed") || lower.includes("permission")) {
    return "Camera access was blocked. Allow camera permission in your browser and try again.";
  }
  if (lower.includes("notfound") || lower.includes("no camera")) {
    return "No camera was found. Connect a USB camera or capture card and try again.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The camera did not respond in time. Check the cable and try again.";
  }
  if (lower.includes("network") || lower.includes("econnrefused")) {
    return "We couldn't reach this network camera. Check power, Ethernet/Wi-Fi, and the IP address.";
  }
  if (lower.includes("ffmpeg")) {
    return "Install FFmpeg on this production computer to scan USB and capture card devices.";
  }

  return raw.length > 160 ? "Unable to complete camera action. Please try again." : raw;
}
