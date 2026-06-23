import {
  isPreLiveLifecycleStage,
  type EventLifecycleStage,
} from "@/lib/experience/event-lifecycle";

export const LIVE_PREVIEW_QUERY_PARAM = "preview";

export function isLivePreviewOverride(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  return searchParams?.get(LIVE_PREVIEW_QUERY_PARAM) === "true";
}

export type LiveStreamGateInput = {
  lifecycleStage: EventLifecycleStage;
  countdownLoading: boolean;
  openingLiveRoom: boolean;
  previewOverride: boolean;
};

/** True when manifest / LiveKit / HLS init is allowed. */
export function shouldInitializeLiveStream(input: LiveStreamGateInput): boolean {
  const { lifecycleStage, countdownLoading, openingLiveRoom, previewOverride } = input;

  if (previewOverride) return true;
  if (countdownLoading || openingLiveRoom) return false;
  return lifecycleStage === "live";
}

/** True when attendee `/live` should render the live room shell (not holding/countdown). */
export function shouldShowLiveRoomShell(input: LiveStreamGateInput): boolean {
  const { lifecycleStage, openingLiveRoom, previewOverride } = input;

  if (previewOverride) return true;
  if (openingLiveRoom) return false;
  return lifecycleStage === "live";
}

/** Skip background live-state polling during pre-live routing windows. */
export function shouldDeferBackgroundLiveSync(
  lifecycleStage: EventLifecycleStage,
  countdownLoading: boolean,
  previewOverride: boolean,
): boolean {
  if (previewOverride) return false;
  if (countdownLoading) return true;
  return isPreLiveLifecycleStage(lifecycleStage);
}
