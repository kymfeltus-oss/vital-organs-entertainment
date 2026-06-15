import ExperienceAttendeeDashboard from "@/components/experience/dashboard/ExperienceAttendeeDashboard";
import { getUserFromSession } from "@/lib/auth/session";
import {
  awakeningHeaderDisplayName,
  firstNameFromEmail,
} from "@/lib/experience/user-profile-display";
import { AWAKENING_PRELOAD_ASSETS } from "@/lib/experience/awakening-dashboard-assets";

export const revalidate = 0;

export default async function ExperienceHubPage() {
  const user = await getUserFromSession();
  const firstName = firstNameFromEmail(user?.email);
  const displayName = awakeningHeaderDisplayName(firstName);

  return (
    <>
      {AWAKENING_PRELOAD_ASSETS.map((href) => (
        <link key={href} rel="preload" as="image" href={href} fetchPriority="high" />
      ))}
      <ExperienceAttendeeDashboard displayName={displayName} />
    </>
  );
}
