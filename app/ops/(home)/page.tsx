import { redirect } from "next/navigation";

export default function OpsHomePage() {
  redirect("/ops/production-dashboard?view=summary");
}
