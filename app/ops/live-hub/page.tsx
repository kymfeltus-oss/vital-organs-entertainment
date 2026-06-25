import { redirect } from "next/navigation";

/** Legacy crew router — land on the active console. */
export default function LiveHubIndexPage() {
  redirect("/ops/live-hub/console");
}
