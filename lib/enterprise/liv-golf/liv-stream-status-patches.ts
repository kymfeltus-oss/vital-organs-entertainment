import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

/** Optimistic live transition while stream-state-sync refresh is in flight. */
export function applyLivStreamLiveTransitionPatch(
  current: LivStreamSetupStatus | null,
): LivStreamSetupStatus | null {
  if (!current) return null;

  return {
    ...current,
    isLive: true,
    canMountPlayer: true,
    publishStatus: "publishing",
    eventPhase: "live",
    capturedAt: new Date().toISOString(),
  };
}

/** Optimistic standby transition after broadcast-end sync signal. */
export function applyLivStreamStandbyPatch(
  current: LivStreamSetupStatus | null,
): LivStreamSetupStatus | null {
  if (!current) return null;

  return {
    ...current,
    isLive: false,
    canMountPlayer: false,
    publishStatus: "offline",
    eventPhase: "ended",
    capturedAt: new Date().toISOString(),
  };
}

export function isLivStreamLiveStatus(status: LivStreamSetupStatus | null | undefined): boolean {
  if (!status) return false;
  return (
    status.isLive ||
    status.canMountPlayer ||
    status.publishStatus === "publishing" ||
    status.eventPhase === "live"
  );
}
