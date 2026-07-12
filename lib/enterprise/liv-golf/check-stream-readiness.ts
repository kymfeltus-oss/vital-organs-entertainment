import { fetchLivStreamStatus } from "@/lib/enterprise/liv-golf/fetch-liv-stream-status";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

export type LivStreamReadinessSnapshot = Pick<
  LivStreamSetupStatus,
  | "isLive"
  | "publishStatus"
  | "eventPhase"
  | "hlsUrl"
  | "manifestReachable"
  | "manifestProbeDetail"
  | "targetDateTime"
  | "scheduleEnded"
  | "encoderConfigured"
  | "readinessBlockers"
  | "goLiveBlockers"
  | "ingestWarnings"
  | "canAttemptGoLive"
  | "canMountPlayer"
>;

/** Fetch current LIV stream readiness from the production status API. */
export async function fetchLivStreamReadiness(
  baseUrl = "",
): Promise<LivStreamSetupStatus> {
  return fetchLivStreamStatus(baseUrl);
}

/** True when the platform publish lane is active and fans may attach HLS playback. */
export function canMountLivPlayer(status: LivStreamReadinessSnapshot | null | undefined): boolean {
  return Boolean(status?.canMountPlayer ?? status?.isLive);
}

/** True when operator may attempt master go-live (hard blockers cleared). */
export function canAttemptLivGoLive(status: LivStreamReadinessSnapshot | null | undefined): boolean {
  return Boolean(status?.canAttemptGoLive);
}

export function formatLivReadinessError(status: LivStreamReadinessSnapshot): string {
  const blockers = status.goLiveBlockers?.length
    ? status.goLiveBlockers
    : status.readinessBlockers;
  return blockers.join(" ");
}
