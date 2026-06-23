import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function LiveHubReadinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("readiness", "/ops/live-hub/readiness");
  return children;
}
