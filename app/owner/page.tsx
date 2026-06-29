import { redirect } from "next/navigation";
import { DEFAULT_TEAM_NEXT } from "@/lib/auth/routing";

export const dynamic = "force-dynamic";

export default function OwnerIndexPage() {
  redirect(DEFAULT_TEAM_NEXT);
}
