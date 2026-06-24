import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function OpsControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("stream_control", "/ops/control");
  return children;
}
