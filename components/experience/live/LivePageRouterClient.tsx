"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";
import type { AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
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
  const router = useRouter();
  const [attendeeUiPhase, setAttendeeUiPhase] = useState<AttendeeUiPhase>(initialAttendeeUiPhase);

  const { config: syncedCountdownConfig } = useCountdownConfig({
    initialConfig: countdownConfig,
  });

  const { attendeeUiPhase: syncedAttendeeUiPhase } = useLiveStreamState({
    enabled: !forceHoldingRoom,
    initialAttendeeUiPhase,
  });

  useEffect(() => {
    if (forceHoldingRoom) return;
    if (syncedAttendeeUiPhase === attendeeUiPhase) return;

    setAttendeeUiPhase(syncedAttendeeUiPhase);
    if (syncedAttendeeUiPhase === "live") {
      router.refresh();
    }
  }, [attendeeUiPhase, forceHoldingRoom, router, syncedAttendeeUiPhase]);

  if (attendeeUiPhase === "live") {
    return (
      <LiveDataLoader
        initialProfile={initialProfile}
        countdownConfig={syncedCountdownConfig}
        initialCountdown={initialCountdown}
      />
    );
  }

  const ended = attendeeUiPhase === "ended";

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={syncedCountdownConfig}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
      attendeeUiPhase={attendeeUiPhase}
      showClock={!ended}
      statusMessage={
        ended
          ? syncedCountdownConfig.outro_headline || "THANK YOU FOR JOINING"
          : undefined
      }
    />
  );
}
