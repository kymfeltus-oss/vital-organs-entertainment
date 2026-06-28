import type { Metadata } from "next";
import { redirect } from "next/navigation";

import OwnerConsoleShell from "@/components/owner/OwnerConsoleShell";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";

export const metadata: Metadata = {
  title: "Owner | Vital Organs Entertainment",
  robots: { index: false, follow: false },
};

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/control"));
  }

  return <OwnerConsoleShell>{children}</OwnerConsoleShell>;
}
