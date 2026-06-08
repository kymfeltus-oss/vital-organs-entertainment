import { redirect } from "next/navigation";

/** Legacy path — operator production console is at /ops/live-hub */
export default function LiveHubRedirectPage() {
  redirect("/ops/live-hub");
}
