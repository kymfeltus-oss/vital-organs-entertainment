import { redirect } from "next/navigation";

export default function LiveHubIncidentPage() {
  redirect("/ops/countdown?view=incident");
}
