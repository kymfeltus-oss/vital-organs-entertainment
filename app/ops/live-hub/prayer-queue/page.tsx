import { redirect } from "next/navigation";

export default function LiveHubPrayerQueuePage() {
  redirect("/ops/countdown?view=prayer");
}
