import { redirect } from "next/navigation";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";

/** Legacy crew router — unified under the production dashboard. */
export default function LiveHubIndexPage() {
  redirect(OPS_HOME_PATH);
}
