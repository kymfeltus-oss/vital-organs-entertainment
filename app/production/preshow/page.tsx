import PreShowSetupClient from "@/components/production/preshow/PreShowSetupClient";
import { loadAdminCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export const metadata = {
  title: "Production Pre-Show Setup | 300 Awakening",
  description: "Guided pre-show setup wizard for producers.",
};

export default async function ProductionPreShowPage() {
  const user = await requireOpsAdminUser("/production/preshow");
  const config = await loadAdminCountdownConfig();

  return (
    <PreShowSetupClient
      initialConfig={config}
      operatorEmail={user.email ?? "producer"}
    />
  );
}
