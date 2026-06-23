import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function LiveHubPrayerQueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("prayer_queue", "/ops/live-hub/prayer-queue");
  return children;
}
