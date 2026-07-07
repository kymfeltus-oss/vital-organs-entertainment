"use client";

import ExperienceHoldingRoomPageClient from "@/components/features/live/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/features/live/LiveDataLoader";
import LiveEndedThankYou from "@/components/features/live/LiveEndedThankYou";
import type { AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
import { useLiveStreamState } from "@/lib/useLiveStreamState";

type LivePageRouterClientProps = {
  initialPhase: AttendeeUiPhase;
  forceHoldingRoom?: boolean;
  initialConfig: EventCountdownConfig;
  initialCountdown: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
};

export default function LivePageRouterClient({
  initialPhase,
  forceHoldingRoom = false,
  initialConfig,
  initialCountdown,
  initialProfile,
}: LivePageRouterClientProps) {
  const { config: syncedCountdownConfig } = useCountdownConfig({
    initialConfig,
  });

  const { attendeeUiPhase, isLive } = useLiveStreamState({
    enabled: !forceHoldingRoom,
    initialAttendeeUiPhase: initialPhase,
  });

  const currentPhase: AttendeeUiPhase = forceHoldingRoom
    ? "pre_show"
    : isLive || attendeeUiPhase === "live"
      ? "live"
      : attendeeUiPhase === "ended"
        ? "ended"
        : "pre_show";

  if (currentPhase === "live") {
    return (
      <LiveDataLoader
        initialProfile={initialProfile}
        countdownConfig={syncedCountdownConfig}
        initialCountdown={initialCountdown}
      />
    );
  }

  if (currentPhase === "ended") {
    return <LiveEndedThankYou />;
  }

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={syncedCountdownConfig}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
      attendeeUiPhase="pre_show"
      showClock
    />
  );
}
