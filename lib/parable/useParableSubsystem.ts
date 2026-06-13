"use client";

import { useBroadcastHealth } from "@/lib/parable/BroadcastHealthContext";
import type { SubsystemId } from "@/lib/parable/health-types";

export function useParableSubsystem(id: SubsystemId) {
  const health = useBroadcastHealth();

  return {
    shouldFetch: () => !health.isSubsystemIsolated(id) && !health.shouldFreezePolling(),
    shouldAllowRealtime: () => health.shouldAllowRealtime() && !health.isSubsystemIsolated(id),
    reportSuccess: (latencyMs?: number) =>
      health.reportSubsystemOutcome(id, "success", latencyMs),
    reportFailure: (message?: string) => {
      health.reportSubsystemOutcome(id, "failure", undefined, message);
      health.isolateSubsystem(id, `${labelFor(id)} paused to protect live stream.`);
    },
    restore: () => health.restoreSubsystem(id),
    isIsolated: health.isSubsystemIsolated(id),
    safeMode: health.safeMode,
  };
}

function labelFor(id: SubsystemId): string {
  switch (id) {
    case "fellowship_chat":
      return "Chat";
    case "polls":
      return "Polls";
    case "seeds":
      return "Seeds";
    case "countdown":
      return "Countdown";
    case "giving":
      return "Giving";
    default:
      return "Feature";
  }
}
