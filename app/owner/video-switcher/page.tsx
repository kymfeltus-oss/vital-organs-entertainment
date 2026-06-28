import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OwnerVideoSwitcherPage() {
  redirect("/owner/video-hub/control");
}
