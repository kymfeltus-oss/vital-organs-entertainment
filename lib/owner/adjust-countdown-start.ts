import {
  loadActiveCountdownConfig,
  saveCountdownConfig,
} from "@/lib/live/fetch-countdown-config";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

export async function adjustCountdownStartBySeconds(
  offsetSeconds: number,
): Promise<{ config: EventCountdownConfig; message: string }> {
  const config = await loadActiveCountdownConfig();
  const startIso = config.start_time?.trim();

  if (!startIso) {
    throw new Error("No active countdown start time to adjust.");
  }

  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) {
    throw new Error("Countdown start time is invalid.");
  }

  const adjustedMs = startMs + offsetSeconds * 1000;
  const nextConfig = await saveCountdownConfig({
    ...config,
    start_time: new Date(adjustedMs).toISOString(),
  });

  const direction = offsetSeconds >= 0 ? "delayed" : "moved earlier";
  return {
    config: nextConfig,
    message: `Show start ${direction} by ${Math.abs(offsetSeconds)} seconds.`,
  };
}
