import { redirect } from "next/navigation";
import BroadcastConsole from "@/components/broadcast/BroadcastConsole";
import { getUserFromSession } from "@/lib/auth/session";

export const metadata = {
  title: "PARABLE Broadcast Console | 300 Awakening",
  description:
    "Professional concert production control — preview/program, media sources, readiness, and distribution network.",
};

export default async function BroadcastDashboardPage() {
  const user = await getUserFromSession();

  if (!user) {
    redirect("/email-gate?next=/dashboard/broadcast");
  }

  return <BroadcastConsole />;
}
