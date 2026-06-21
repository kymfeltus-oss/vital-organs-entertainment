import { Suspense } from "react";
import PrayerPageClient from "@/components/prayer/PrayerPageClient";
export const dynamic = "force-dynamic";

export default function PrayerPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-brand-black"
      aria-label="Prayer"
    >
      <Suspense fallback={null}>
        <PrayerPageClient />
      </Suspense>
    </main>
  );
}
