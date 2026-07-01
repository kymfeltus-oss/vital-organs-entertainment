"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { useEventPhase } from "@/lib/live/useEventPhase";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
import { useLiveStreamState } from "@/lib/useLiveStreamState";

type LivePageRouterPhase = "holding" | "waiting" | "live" | "ended";

type LivePageRouterClientProps = {
  initialPhase: LivePageRouterPhase;
  forceHoldingRoom?: boolean;
  countdownConfig: EventCountdownConfig;
  initialCountdown: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
};

export default function LivePageRouterClient({
  initialPhase,
  forceHoldingRoom = false,
  countdownConfig,
  initialCountdown,
  initialProfile,
}: LivePageRouterClientProps) {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<LivePageRouterPhase>(initialPhase);

  // Same source as holding-room clock: cockpit → event_countdown_config → /api/countdown
  const { config: syncedCountdownConfig } = useCountdownConfig({
    initialConfig: countdownConfig,
  });

  // Trigger A: schedule window (local clock vs cockpit-saved start_time / end_time)
  const schedulePhase = useEventPhase(
    syncedCountdownConfig.start_time,
    syncedCountdownConfig.end_time,
  );

  // Trigger B: cockpit go-live (stream-state-sync + /api/access/live)
  const { isLive } = useLiveStreamState({ enabled: !forceHoldingRoom });

  useEffect(() => {
    if (forceHoldingRoom) return;

    const shouldShowLiveStream = isLive || schedulePhase === "live";

    if (shouldShowLiveStream && currentPhase !== "live") {
      setCurrentPhase("live");
      router.refresh();
    }
  }, [currentPhase, forceHoldingRoom, isLive, schedulePhase, router]);

  if (currentPhase === "live") {
    return <LiveDataLoader initialProfile={initialProfile} />;
  }

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={syncedCountdownConfig}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
    />
  );
}
