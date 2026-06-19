import { Suspense } from "react";
import BuySeedsPageClient from "@/components/buy-seeds/BuySeedsPageClient";

export const dynamic = "force-dynamic";

export default function BuySeedsPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black pt-safe pb-safe"
    >
      <Suspense fallback={null}>
        <BuySeedsPageClient />
      </Suspense>
    </main>
  );
}
