import VodBrowseClient from "@/components/features/browse/VodBrowseClient";

export const dynamic = "force-dynamic";

export default function BrowsePage() {
  return (
    <main id="main-content" className="min-h-dvh w-full bg-black">
      <VodBrowseClient />
    </main>
  );
}
