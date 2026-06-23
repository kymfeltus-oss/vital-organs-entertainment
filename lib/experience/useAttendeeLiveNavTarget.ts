"use client";

import { useMemo } from "react";
import { resolveAttendeeLiveNavTarget } from "@/lib/experience/resolve-live-nav-target";
import type { AttendeeLiveNavTarget } from "@/lib/experience/resolve-live-nav-target";
import { PUBLIC_COUNTDOWN_PATH } from "@/lib/experience/live-routes";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useCountdownConfig } from "@/lib/useCountdownConfig";

type UseAttendeeLiveNavTargetOptions = {
  initialConfig?: EventCountdownConfig;
};

type UseAttendeeLiveNavTargetResult = {
  href: AttendeeLiveNavTarget;
  isLoading: boolean;
};

/** Dynamic `/countdown` vs `/live` target from synced schedule + broadcast override. */
export function useAttendeeLiveNavTarget(
  options: UseAttendeeLiveNavTargetOptions = {},
): UseAttendeeLiveNavTargetResult {
  const { config, isLoading: countdownLoading } = useCountdownConfig({
    initialConfig: options.initialConfig,
  });
  const { isLive: broadcastIsLive, isLoading: broadcastLoading } = useAttendeeLiveState();

  const href = useMemo(
    () =>
      resolveAttendeeLiveNavTarget(config.start_time, config.end_time, {
        broadcastIsLive,
      }),
    [broadcastIsLive, config.end_time, config.start_time],
  );

  return {
    href,
    isLoading: countdownLoading || broadcastLoading,
  };
}

/** Conservative default while schedule sync is in flight. */
export const ATTENDEE_LIVE_NAV_FALLBACK = PUBLIC_COUNTDOWN_PATH;
