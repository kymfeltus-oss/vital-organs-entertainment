"use client";

import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";
import type { AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { useAttendeePlaybackReady } from "@/lib/live/use-attendee-playback-ready";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
import { useLiveStreamState } from "@/lib/useLiveStreamState";

type LivePageRouterClientProps = {
  initialAttendeeUiPhase: AttendeeUiPhase;
  forceHoldingRoom?: boolean;
  countdownConfig: EventCountdownConfig;
  initialCountdown: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
};

export default function LivePageRouterClient({
  initialAttendeeUiPhase,
  forceHoldingRoom = false,
  countdownConfig,
  initialCountdown,
  initialProfile,
}: LivePageRouterClientProps) {
  const { config: syncedCountdownConfig } = useCountdownConfig({
    initialConfig: countdownConfig,
  });

  const { attendeeUiPhase, publishMode, isLive, isLoading: streamStateLoading } = useLiveStreamState({
    enabled: !forceHoldingRoom,
    initialAttendeeUiPhase,
  });

  const effectivePhase: AttendeeUiPhase = forceHoldingRoom ? "pre_show" : attendeeUiPhase;
  const broadcastLive = !streamStateLoading && isLive && effectivePhase === "live";
  const directCameraShell = broadcastLive && publishMode === "browser_camera";
  const { isReady: playbackReady } = useAttendeePlaybackReady(
    broadcastLive && publishMode !== "browser_camera",
  );

  if (broadcastLive && (playbackReady || directCameraShell)) {
    return (
      <LiveDataLoader
        initialProfile={initialProfile}
        countdownConfig={syncedCountdownConfig}
        initialCountdown={initialCountdown}
      />
    );
  }

  const ended = effectivePhase === "ended";

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={syncedCountdownConfig}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
      attendeeUiPhase={effectivePhase === "live" ? "pre_show" : effectivePhase}
      showClock={!ended}
      statusMessage={
        ended
          ? syncedCountdownConfig.outro_headline || "THANK YOU FOR JOINING"
          : undefined
      }
    />
  );
}
