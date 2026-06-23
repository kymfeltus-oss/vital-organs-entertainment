"use client";

import ViewerPovGoLiveShell from "@/components/experience/live/pov/ViewerPovGoLiveShell";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLiveStreamGate } from "@/lib/experience/useLiveStreamGate";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ViewerPovGoLiveGatedClientProps = {
  initialProfile: AttendeeProfileSnapshot;
  initialCountdownConfig?: EventCountdownConfig;
};

/** POV preview route — respects lifecycle gate before initializing stream fetches. */
export default function ViewerPovGoLiveGatedClient({
  initialProfile,
  initialCountdownConfig,
}: ViewerPovGoLiveGatedClientProps) {
  const { streamEnabled, showLiveRoom } =
    useLiveStreamGate({ initialConfig: initialCountdownConfig });

  if (!showLiveRoom) {
    return <LightweightLiveLoading />;
  }

  return (
    <ViewerPovGoLiveShell initialProfile={initialProfile} streamEnabled={streamEnabled} />
  );
}
