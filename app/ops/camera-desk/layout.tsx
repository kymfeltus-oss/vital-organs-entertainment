import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export default async function CameraDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("camera_desk", "/ops/camera-desk");
  return children;
}
