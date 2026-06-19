import ExperienceGivingPageClient from "@/components/experience/giving/ExperienceGivingPageClient";
import { hydrateAuthMetadataFromAttendee } from "@/lib/auth/sync-attendee-profile";
import { getUserFromSession } from "@/lib/auth/session";
import { fetchAttendeeProfileRecord } from "@/lib/experience/fetch-attendee-profile";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

export default async function GivingPage() {
  let user = await getUserFromSession();
  let attendeeRecord = user ? await fetchAttendeeProfileRecord(user.id) : null;

  if (user) {
    user = await hydrateAuthMetadataFromAttendee(user);
    if (!attendeeRecord) {
      attendeeRecord = await fetchAttendeeProfileRecord(user.id);
    }
  }

  const profile = buildAttendeeProfileSnapshot(user, attendeeRecord);

  return (
    <main id="main-content" className="min-h-dvh w-full">
      <ExperienceGivingPageClient initialProfile={profile} />
    </main>
  );
}
