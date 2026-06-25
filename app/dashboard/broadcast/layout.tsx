import ParableProductionRoot from "@/components/parable/ParableProductionRoot";
import { redirect } from "next/navigation";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { isOpsAdminUser } from "@/lib/ops/admin-auth";
import {
  isOpsRoleCheckBypassed,
  readOpsCrewRoleCookie,
  resolveOpsCrewRole,
} from "@/lib/ops/crew-role-auth";
import { canAccessModule } from "@/lib/ops/team-roles";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export default async function ParableSandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildTeamGateUrl("/dashboard/broadcast"));
  }

  if (!isOpsAdminUser(user)) {
    redirect(buildTeamGateUrl("/dashboard/broadcast"));
  }

  const cookieRole = await readOpsCrewRoleCookie();
  const role = resolveOpsCrewRole(user, cookieRole);

  if (
    !isOpsRoleCheckBypassed(user) &&
    !canAccessModule(role, "broadcast_console")
  ) {
    redirect("/ops/unauthorized?reason=sandbox_restricted_to_broadcast_operators&module=broadcast_console");
  }

  return <ParableProductionRoot>{children}</ParableProductionRoot>;
}
