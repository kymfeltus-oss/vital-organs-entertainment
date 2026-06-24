import Link from "next/link";
import OpsResetCrewRoleButton from "@/components/ops/OpsResetCrewRoleButton";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { readOpsCrewRoleCookie, resolveOpsCrewRole } from "@/lib/ops/crew-role-auth";
import { roleLabel } from "@/lib/ops/team-roles";

type UnauthorizedPageProps = {
  searchParams: Promise<{
    reason?: string;
    module?: string;
  }>;
};

export default async function OpsUnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const user = await requireOpsAdminUser("/ops/unauthorized");
  const params = await searchParams;
  const cookieRole = await readOpsCrewRoleCookie();
  const role = resolveOpsCrewRole(user, cookieRole);

  const reason = params.reason ?? "insufficient_crew_clearance";
  const moduleId = params.module ?? "unknown";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand-black px-6 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-panel p-8 text-center">
        <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.24em] text-brand-pink">
          Ops Access Restricted
        </p>
        <h1 className="mt-4 font-headline text-2xl uppercase tracking-[0.12em]">
          Insufficient Crew Clearance
        </h1>
        <p className="mt-4 font-body text-sm text-brand-muted">
          Your crew role filter is hiding this module. Ops admins can open any console — switch
          back to Admin on the Production Dashboard, or use the button below.
        </p>
        <dl className="mt-6 space-y-2 text-left text-xs text-brand-muted">
          <div className="flex justify-between gap-4">
            <dt>Reason</dt>
            <dd className="font-mono text-white">{reason}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Module</dt>
            <dd className="font-mono text-white">{moduleId}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Current role</dt>
            <dd className="font-mono text-white">{roleLabel(role)}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-col items-center gap-4">
          <OpsResetCrewRoleButton />
          <Link
            href={OPS_HOME_PATH}
            className="inline-flex min-h-11 items-center rounded-full border border-brand-blue/50 bg-brand-blue/10 px-6 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-blue transition hover:bg-brand-blue/20"
          >
            Production Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
