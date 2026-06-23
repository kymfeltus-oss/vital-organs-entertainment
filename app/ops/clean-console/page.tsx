import { redirect } from "next/navigation";

export default function CleanConsoleRedirectPage() {
  redirect("/ops/live-hub/console");
}
