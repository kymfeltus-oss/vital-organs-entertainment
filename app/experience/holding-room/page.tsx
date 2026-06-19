import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const revalidate = 0;

export default async function ExperienceHoldingRoomPage() {
  const initialCountdownConfig = await loadActiveCountdownConfig();

  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black pt-safe pb-safe">
      <ExperienceHoldingRoomPageClient initialCountdownConfig={initialCountdownConfig} />
    </main>
  );
}
