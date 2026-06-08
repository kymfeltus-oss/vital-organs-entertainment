import { Suspense } from "react";
import { redirect } from "next/navigation";
import AttendeeEventLobbyClient from "@/components/dashboard/AttendeeEventLobbyClient";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import { getUserFromSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getUserFromSession();

  if (!user) {
    redirect("/email-gate?next=/dashboard");
  }

  return (
    <Suspense fallback={<LightweightLiveLoading />}>
      <AttendeeEventLobbyClient />
    </Suspense>
  );
}
