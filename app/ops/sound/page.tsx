import OpsSoundModuleClient from "@/components/ops/sound/OpsSoundModuleClient";
import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export const metadata = {
  title: "Sound | 300 Awakening Ops",
  description: "Audio orchestration — meters, mixer, and routing.",
};

export default async function OpsSoundPage() {
  await requireCrewModuleAccess("ops_sound", "/ops/sound");
  return <OpsSoundModuleClient />;
}
