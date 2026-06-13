import { redirect } from "next/navigation";
import AttendeeEventLobbyClient from "@/components/dashboard/AttendeeEventLobbyClient";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { getUserFromSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getUserFromSession();

  if (!user) {
    redirect("/email-gate?next=/dashboard");
  }

  const initialCountdownConfig = await loadActiveCountdownConfig();

  return (
    <AttendeeEventLobbyClient initialCountdownConfig={initialCountdownConfig} />
  );
}
