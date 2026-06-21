import { Suspense } from "react";
import BuySeedsPageClient from "@/components/buy-seeds/BuySeedsPageClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";

export const dynamic = "force-dynamic";

export default async function BuySeedsPage() {
  const profile = await loadTabPageProfile();

  return (
    <main
      id="main-content"
      className={`${DEVICE_FIT_PAGE} flex min-h-0 flex-1 flex-col overflow-x-hidden bg-brand-black`}
      aria-label="Buy Seeds"
    >
      <Suspense fallback={null}>
        <BuySeedsPageClient initialProfile={profile} />
      </Suspense>
    </main>
  );
}
