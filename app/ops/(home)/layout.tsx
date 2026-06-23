import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function OpsHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("ops_home", "/ops");
  return children;
}
