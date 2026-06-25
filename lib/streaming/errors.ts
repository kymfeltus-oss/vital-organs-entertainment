export function plainEnglishStreamingError(error: unknown, platform?: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const lower = raw.toLowerCase();
  const label = platform ? platform.replace(/_/g, " ") : "streaming";

  if (lower.includes("401") || lower.includes("expired") || lower.includes("invalid_grant")) {
    return `${capitalize(label)} permission expired. Please reconnect your account.`;
  }
  if (lower.includes("403") || lower.includes("permission")) {
    return `${capitalize(label)} permissions are missing. Please reconnect and grant live streaming access.`;
  }
  if (lower.includes("timeout") || lower.includes("etimedout") || lower.includes("timed out")) {
    return `Unable to reach ${capitalize(label)}. Check your internet connection and try again.`;
  }
  if (lower.includes("econnrefused") || lower.includes("enotfound") || lower.includes("network")) {
    return "Internet connection lost or streaming server unavailable.";
  }
  if (lower.includes("not configured")) {
    return "Streaming account connection is not configured on this production server.";
  }
  if (lower.includes("not connected")) {
    return `${capitalize(label)} is not connected yet. Please connect your account.`;
  }
  if (lower.includes("503") || lower.includes("service unavailable")) {
    return "Streaming server unavailable. Try again in a moment.";
  }

  return raw.length > 160 ? `Unable to complete ${label} action. Please try again.` : raw;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
