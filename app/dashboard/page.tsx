import { redirect } from "next/navigation";

/** Legacy attendee home — forwards to the cinematic `/experience` hub. */
export default function DashboardPage() {
  redirect("/experience");
}
