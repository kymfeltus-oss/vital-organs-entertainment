import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function LiveHubIncidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("incident", "/ops/live-hub/incident");
  return children;
}
