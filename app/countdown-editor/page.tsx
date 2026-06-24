import { redirect } from "next/navigation";
import { OPS_COUNTDOWN_EDITOR_PATH } from "@/lib/broadcastRoutes";

/** Alias route — canonical countdown editor lives at /ops/countdown. */
export default function CountdownEditorAliasPage() {
  redirect(OPS_COUNTDOWN_EDITOR_PATH);
}

export const metadata = {
  title: "Countdown Editor | 300 Awakening Ops",
};
