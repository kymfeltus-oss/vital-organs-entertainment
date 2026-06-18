"use client";

import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import { useEventCountdown } from "@/lib/experience/useEventCountdown";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useEventPhase } from "@/lib/live/useEventPhase";
import { useCountdownConfig } from "@/lib/useCountdownConfig";

type UseLobbyCountdownOptions = {
  initialConfig?: EventCountdownConfig;
};

export function useLobbyCountdown(options: UseLobbyCountdownOptions = {}) {
  const { config, isLoading } = useCountdownConfig({
    initialConfig: options.initialConfig,
  });
  const countdown = useEventCountdown(config.start_time);
  const eventPhase = useEventPhase(config.start_time, config.end_time);
  const showTimer = shouldShowCountdownTimer(config, isLoading);

  return {
    config,
    countdown,
    eventPhase,
    isLoading,
    showTimer,
  };
}
