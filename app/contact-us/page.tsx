import { Suspense } from "react";
import ContactUsPageClient from "@/components/features/contact/ContactPageClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";

export const dynamic = "force-dynamic";

export default async function ContactUsPage() {
  const profile = await loadTabPageProfile();

  return (
    <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col overflow-hidden" aria-label="Contact us">
      <Suspense fallback={null}>
        <ContactUsPageClient initialProfile={profile} />
      </Suspense>
    </main>
  );
}
