import ExperienceAttendeeDashboard from "@/components/experience/dashboard/ExperienceAttendeeDashboard";
import { hydrateAuthMetadataFromAttendee } from "@/lib/auth/sync-attendee-profile";
import { getUserFromSession } from "@/lib/auth/session";
import { fetchAttendeeProfileRecord } from "@/lib/experience/fetch-attendee-profile";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { AWAKENING_PRELOAD_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const revalidate = 0;

export default async function ExperienceHubPage() {
  let user = await getUserFromSession();
  let attendeeRecord = user ? await fetchAttendeeProfileRecord(user.id) : null;

  if (user) {
    user = await hydrateAuthMetadataFromAttendee(user);
    if (!attendeeRecord) {
      attendeeRecord = await fetchAttendeeProfileRecord(user.id);
    }
  }

  const profile = buildAttendeeProfileSnapshot(user, attendeeRecord);
  const initialCountdownConfig = await loadActiveCountdownConfig();

  return (
    <>
      {AWAKENING_PRELOAD_ASSETS.map((asset) => (
        <link
          key={asset.href}
          rel="preload"
          as={asset.as}
          href={asset.href}
          fetchPriority="high"
        />
      ))}
      <ExperienceAttendeeDashboard
        initialProfile={profile}
        initialCountdownConfig={initialCountdownConfig}
      />
    </>
  );
}
