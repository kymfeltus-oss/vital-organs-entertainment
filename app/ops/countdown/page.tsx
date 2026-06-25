import OpsCountdownModuleClient from "@/components/ops/countdown/OpsCountdownModuleClient";
import { loadAdminCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

type OpsCountdownPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function OpsCountdownPage({ searchParams }: OpsCountdownPageProps) {
  const params = await searchParams;
  const view = params.view ?? "console";

  const ctx =
    view === "prayer"
      ? await requireCrewModuleAccess("prayer_queue", "/ops/countdown")
      : view === "incident"
        ? await requireCrewModuleAccess("incident", "/ops/countdown")
        : await requireCrewModuleAccess("countdown_editor", "/ops/countdown");

  const config = await loadAdminCountdownConfig();
  const snapshot = await loadOpsSnapshot();

  return (
    <OpsCountdownModuleClient
      adminEmail={ctx.user.email ?? "unknown"}
      initialConfig={config}
      initialSnapshot={snapshot}
    />
  );
}
