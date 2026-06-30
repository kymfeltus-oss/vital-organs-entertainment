import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";

/** Renders the clean /live shell with the shared attendee tab profile state. */
export default async function LiveDataLoader() {
  const initialProfile = await loadTabPageProfile();

  return (
    <LiveExperienceClient initialProfile={initialProfile} />
  );
}
