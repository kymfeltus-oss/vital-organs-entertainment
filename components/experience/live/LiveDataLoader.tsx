import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type LiveDataLoaderProps = {
  initialProfile: AttendeeProfileSnapshot;
};

export default function LiveDataLoader({ initialProfile }: LiveDataLoaderProps) {
  return <LiveExperienceClient initialProfile={initialProfile} />;
}
