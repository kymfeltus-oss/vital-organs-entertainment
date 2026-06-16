import MusicPageClient from "@/components/music/MusicPageClient";

export default function MusicPage() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-brand-black pt-safe pb-safe">
      <MusicPageClient />
    </main>
  );
}
