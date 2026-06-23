import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function LiveHubConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("crew_console", "/ops/live-hub/console");
  return children;
}
