import { redirect } from "next/navigation";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";

export default function LivePage() {
  redirect(EXPERIENCE_LIVE_PATH);
}
