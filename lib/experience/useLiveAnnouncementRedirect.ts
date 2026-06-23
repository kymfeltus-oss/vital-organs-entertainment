"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  computeEventLifecycleStage,
  resolveAttendeeLifecycleStage,
} from "@/lib/experience/event-lifecycle";
import { PUBLIC_COUNTDOWN_PATH } from "@/lib/experience/live-routes";
import { isLivePreviewOverride } from "@/lib/experience/live-stream-gate";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
import { computeEventCountdownPhase } from "@/lib/live/countdown-config";
import { useSearchParams } from "next/navigation";

/**
 * When an attendee opens `/live` more than 2 hours before start (announcement phase)
 * and ops has not ramped live, forward to the public countdown page.
 */
export function useLiveAnnouncementRedirect(enabled = true): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewOverride = isLivePreviewOverride(searchParams);
  const { config, isLoading: configLoading } = useCountdownConfig();
  const { isLive: broadcastIsLive, isLoading: broadcastLoading } = useAttendeeLiveState({
    enabled: enabled && !previewOverride,
  });

  useEffect(() => {
    if (!enabled || previewOverride || configLoading || broadcastLoading || !config) return;

    const nowMs = Date.now();
    const scheduleStage = computeEventLifecycleStage(config.start_time, config.end_time, nowMs);
    const countdownPhase = computeEventCountdownPhase(config.start_time, config.end_time, nowMs);
    const lifecycleStage = resolveAttendeeLifecycleStage(scheduleStage, {
      broadcastIsLive,
      countdownPhase,
    });

    if (lifecycleStage === "announcement") {
      router.replace(PUBLIC_COUNTDOWN_PATH);
    }
  }, [broadcastIsLive, broadcastLoading, config, configLoading, enabled, previewOverride, router]);
}
