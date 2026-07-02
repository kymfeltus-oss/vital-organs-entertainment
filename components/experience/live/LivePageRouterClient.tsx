"use client";

import { useEffect, useState } from "react";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";
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
  const [currentPhase, setCurrentPhase] = useState<AttendeeUiPhase>(initialPhase);

  const { config: syncedCountdownConfig } = useCountdownConfig({
    initialConfig,
  });

  const { attendeeUiPhase, isLive } = useLiveStreamState({
    enabled: !forceHoldingRoom,
    initialAttendeeUiPhase: initialPhase,
  });

  useEffect(() => {
    if (forceHoldingRoom) return;

    const promotedPhase: AttendeeUiPhase =
      isLive || attendeeUiPhase === "live"
        ? "live"
        : attendeeUiPhase === "ended"
          ? "ended"
          : "pre_show";

    if (promotedPhase === currentPhase) return;
    setCurrentPhase(promotedPhase);
  }, [attendeeUiPhase, currentPhase, forceHoldingRoom, isLive]);

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
    return (
      <ExperienceHoldingRoomPageClient
        initialCountdownConfig={syncedCountdownConfig}
        initialCountdown={initialCountdown}
        initialProfile={initialProfile}
        attendeeUiPhase="ended"
        showClock={false}
        statusMessage={syncedCountdownConfig.outro_headline || "THANK YOU FOR JOINING"}
      />
    );
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
