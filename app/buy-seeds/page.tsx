import { Suspense } from "react";
import BuySeedsPageClient from "@/components/buy-seeds/BuySeedsPageClient";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";

export const dynamic = "force-dynamic";

export default function BuySeedsPage() {
  return (
    <main
      id="main-content"
      className={`${DEVICE_FIT_PAGE} flex min-h-0 flex-1 flex-col overflow-x-hidden bg-brand-black pt-safe`}
      aria-label="Buy Seeds"
    >
      <Suspense fallback={null}>
        <BuySeedsPageClient />
      </Suspense>
    </main>
  );
}
