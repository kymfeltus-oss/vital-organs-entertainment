import VodBrowseClient from "@/components/features/browse/VodBrowseClient";
import type { BrowseCatalogItem } from "@/lib/features/browse/vod-catalog";

export const dynamic = "force-dynamic";

const MOCK_CATALOG: BrowseCatalogItem[] = [
  {
    id: "parable-vod-1",
    title: "PΛRΛBLE OS 1.0: Unveiling Global Media Infrastructure",
    duration: "42:15",
    tierRequired: "starter",
    views: "24.8K views",
    category: "Keynotes",
  },
  {
    id: "parable-vod-2",
    title: "Sovereign Ad Injection & VAST/VMAP Integration Protocol",
    duration: "14:50",
    tierRequired: "pro",
    views: "11.3K views",
    category: "Developer Tutorials",
  },
  {
    id: "parable-vod-3",
    title: "Capacitor Hybrid Pipelines & Independent Store Submissions",
    duration: "31:02",
    tierRequired: "enterprise",
    views: "5.9K views",
    category: "Advanced Protocols",
  },
];

export default function BrowsePage() {
  return (
    <main id="main-content" className="min-h-dvh w-full bg-black">
      <VodBrowseClient catalog={MOCK_CATALOG} />
    </main>
  );
}
