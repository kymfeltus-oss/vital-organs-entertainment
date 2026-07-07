import type { Metadata } from "next";
import ExperienceAttendeeDashboard from "@/components/experience/dashboard/ExperienceAttendeeDashboard";
import { hydrateAuthMetadataFromAttendee } from "@/lib/auth/sync-attendee-profile";
import { getUserFromSession } from "@/lib/auth/session";
import { fetchAttendeeProfileRecord } from "@/lib/experience/fetch-attendee-profile";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import AttendeeInstallPrompt from "@/components/pwa/AttendeeInstallPrompt";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";

export const revalidate = 0;

export const metadata: Metadata = {
  title: `Dashboard | ${DEFAULT_TENANT_THEME.appName}`,
  description: DEFAULT_TENANT_THEME.tagline,
};

export default async function AttendeeDashboardPage() {
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
  const initialCountdown = computeCountdown(initialCountdownConfig.start_time);

  return (
    <>
      <main id="main-content" className="min-h-dvh w-full">
        <ExperienceAttendeeDashboard
          initialProfile={profile}
          initialCountdownConfig={initialCountdownConfig}
          initialCountdown={initialCountdown}
        />
      </main>
      <AttendeeInstallPrompt />
    </>
  );
}
