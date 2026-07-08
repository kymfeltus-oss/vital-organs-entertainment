import GivingPageClient from "@/components/features/giving/GivingPageClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";

export const dynamic = "force-dynamic";

export default async function GivingPage() {
  const profile = await loadTabPageProfile();

  return (
    <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <GivingPageClient initialProfile={profile} />
    </main>
  );
}
