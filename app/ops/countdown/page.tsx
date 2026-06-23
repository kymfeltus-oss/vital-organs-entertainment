import CountdownAdminClient from "@/components/ops/CountdownAdminClient";
import { loadAdminCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export default async function OpsCountdownPage() {
  const user = await requireOpsAdminUser("/ops/countdown");
  const config = await loadAdminCountdownConfig();
  const initialPreviewNowMs = Date.now();

  return (
    <CountdownAdminClient
      adminEmail={user.email ?? "unknown"}
      initialConfig={config}
      initialPreviewNowMs={initialPreviewNowMs}
    />
  );
}
