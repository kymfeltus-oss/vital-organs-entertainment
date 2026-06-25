import IncidentLogsClient from "@/components/incidents/IncidentLogsClient";
import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";

export const metadata = {
  title: "Incident Logs | Parable Streaming Platform",
  description: "Broadcast incident monitoring, access logs, and production safety events.",
};

export default async function IncidentLogsPage() {
  const ctx = await requireCrewModuleAccess("incident", "/dashboard/incidents");

  return <IncidentLogsClient operatorEmail={ctx.user.email ?? "producer@300a.com"} />;
}
