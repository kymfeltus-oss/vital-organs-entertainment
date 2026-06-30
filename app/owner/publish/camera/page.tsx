import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OwnerPublishCameraPage() {
  redirect("/owner/cockpit");
}
