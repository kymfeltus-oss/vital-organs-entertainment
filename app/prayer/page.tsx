import { Suspense } from "react";
import PrayerPageClient from "@/components/prayer/PrayerPageClient";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";

export const dynamic = "force-dynamic";

export default function PrayerPage() {
  return (
    <main
      id="main-content"
      className={`${DEVICE_FIT_PAGE} flex min-h-0 flex-1 flex-col overflow-x-hidden bg-brand-black pt-safe`}
      aria-label="Prayer"
    >
      <Suspense fallback={null}>
        <PrayerPageClient />
      </Suspense>
    </main>
  );
}
