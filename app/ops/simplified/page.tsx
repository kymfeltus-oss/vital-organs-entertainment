import { redirect } from "next/navigation";

/** Legacy alias — stream master controls live at /ops/control. */
export default function SimplifiedOpsCenterPage() {
  redirect("/ops/control");
}
