import { redirect } from "next/navigation";

export default function CameraDeskPage() {
  redirect("/ops/camera?view=mobile-desk");
}
