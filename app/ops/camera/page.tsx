import OpsCameraModuleClient from "@/components/ops/camera/OpsCameraModuleClient";
import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export const metadata = {
  title: "Camera | 300 Awakening Ops",
  description: "Camera ingest credentials, input matrix, and mobile desk.",
};

export default async function OpsCameraPage() {
  await requireCrewModuleAccess("camera_desk", "/ops/camera");
  return <OpsCameraModuleClient />;
}
