import { redirect } from "next/navigation";

export default function OpsControlPage() {
  redirect("/ops/countdown?view=console");
}
