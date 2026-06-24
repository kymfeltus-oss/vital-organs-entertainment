import { redirect } from "next/navigation";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";

/** Legacy path — operator production hub is at /ops */
export default function LiveHubRedirectPage() {
  redirect(OPS_HOME_PATH);
}
