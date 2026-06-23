"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  computeEventLifecycleStage,
  resolveAttendeeLifecycleStage,
} from "@/lib/experience/event-lifecycle";
import {
  isLivePreviewOverride,
  shouldDeferBackgroundLiveSync,
  shouldInitializeLiveStream,
  shouldShowLiveRoomShell,
  type LiveStreamGateInput,
} from "@/lib/experience/live-stream-gate";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
import {
  computeEventCountdownPhase,
  type EventCountdownConfig,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

function resolveAttendeeEventPhase(
  clientPhase: EventCountdownPhase,
  serverPhase: EventCountdownPhase,
): EventCountdownPhase {
  if (clientPhase === "live" && serverPhase === "live") return "live";
  if (clientPhase === "waiting" || serverPhase === "waiting") return "waiting";
  return "ended";
}

type UseLiveStreamGateOptions = {
  initialConfig?: EventCountdownConfig;
  openingLiveRoom?: boolean;
};

export function useLiveStreamGate(options: UseLiveStreamGateOptions = {}) {
  const searchParams = useSearchParams();
  const previewOverride = isLivePreviewOverride(searchParams);
  const openingLiveRoom = options.openingLiveRoom ?? false;

  const {
    config: countdownConfig,
    eventPhase,
    isLoading: countdownLoading,
  } = useLobbyCountdown({
    initialConfig: options.initialConfig,
  });

  const scheduleStage = useMemo(() => {
    const startIso =
      countdownLoading && options.initialConfig
        ? options.initialConfig.start_time
        : countdownConfig.start_time;
    const endIso =
      countdownLoading && options.initialConfig
        ? options.initialConfig.end_time
        : countdownConfig.end_time;

    return computeEventLifecycleStage(startIso, endIso);
  }, [
    countdownConfig.end_time,
    countdownConfig.start_time,
    countdownLoading,
    options.initialConfig,
  ]);

  const deferBackgroundLiveSync = shouldDeferBackgroundLiveSync(
    scheduleStage,
    countdownLoading,
    previewOverride,
  );

  const { isLive: broadcastIsLive } = useAttendeeLiveState({
    enabled: !deferBackgroundLiveSync,
  });

  const serverPhase = computeEventCountdownPhase(
    options.initialConfig?.start_time ?? countdownConfig.start_time,
    options.initialConfig?.end_time ?? countdownConfig.end_time,
  );
  const routingPhase = resolveAttendeeEventPhase(eventPhase, serverPhase);

  const lifecycleStage = useMemo(() => {
    if (countdownLoading && !previewOverride) {
      return scheduleStage;
    }

    return resolveAttendeeLifecycleStage(scheduleStage, {
      broadcastIsLive: deferBackgroundLiveSync ? false : broadcastIsLive,
      countdownPhase: routingPhase,
    });
  }, [
    broadcastIsLive,
    countdownLoading,
    deferBackgroundLiveSync,
    previewOverride,
    routingPhase,
    scheduleStage,
  ]);

  const streamGateInput: LiveStreamGateInput = {
    lifecycleStage,
    countdownLoading,
    openingLiveRoom,
    previewOverride,
  };

  return {
    lifecycleStage,
    scheduleStage,
    countdownLoading,
    previewOverride,
    broadcastIsLive,
    showLiveRoom: shouldShowLiveRoomShell(streamGateInput),
    streamEnabled: shouldInitializeLiveStream(streamGateInput),
    streamGateInput,
  };
}
