import { redirect } from "next/navigation";
import AttendeeEventLobbyClient from "@/components/dashboard/AttendeeEventLobbyClient";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { getUserFromSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getUserFromSession();

  if (!user) {
    redirect(buildAttendeeGateUrl("/dashboard"));
  }

  const initialCountdownConfig = await loadActiveCountdownConfig();

  return (
    <AttendeeEventLobbyClient initialCountdownConfig={initialCountdownConfig} />
  );
}
