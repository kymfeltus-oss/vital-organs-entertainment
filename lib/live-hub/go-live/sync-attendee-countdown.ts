import {
  computeEventCountdownPhase,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";
import {
  loadAdminCountdownConfig,
  saveCountdownConfig,
} from "@/lib/live/fetch-countdown-config";

const DEFAULT_LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

export type SyncCountdownForGoLiveResult = {
  ok: true;
  updated: boolean;
  previousPhase: EventCountdownPhase;
};

/**
 * When ops goes live, align attendee `/live` schedule so holding room opens the live POV.
 * Skips write if countdown is already in the live window.
 */
export async function syncCountdownScheduleForGoLive(): Promise<SyncCountdownForGoLiveResult> {
  const config = await loadAdminCountdownConfig();
  const now = new Date();
  const previousPhase = computeEventCountdownPhase(config.start_time, config.end_time);

  if (previousPhase === "live") {
    return { ok: true, updated: false, previousPhase };
  }

  const endMs = new Date(config.end_time).getTime();
  const end_time =
    endMs > now.getTime()
      ? config.end_time
      : new Date(now.getTime() + DEFAULT_LIVE_WINDOW_MS).toISOString();

  await saveCountdownConfig({
    ...config,
    start_time: now.toISOString(),
    end_time,
    is_active: true,
  });

  return { ok: true, updated: true, previousPhase };
}
