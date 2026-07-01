import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type LiveDataLoaderProps = {
  initialProfile: AttendeeProfileSnapshot;
  countdownConfig: EventCountdownConfig;
  initialCountdown: CountdownParts;
};

export default function LiveDataLoader({
  initialProfile,
  countdownConfig,
  initialCountdown,
}: LiveDataLoaderProps) {
  return (
    <LiveExperienceClient
      initialProfile={initialProfile}
      countdownConfig={countdownConfig}
      initialCountdown={initialCountdown}
    />
  );
}
