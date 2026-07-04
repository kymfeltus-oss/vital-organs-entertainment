import Link from "next/link";
import { redirect } from "next/navigation";
import { MonitorPlay } from "lucide-react";
import GraphicsSuitePrepClient from "@/components/owner/GraphicsSuitePrepClient";
import OwnerProductionSideMenu from "@/components/owner/OwnerProductionSideMenu";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";

export const dynamic = "force-dynamic";

export default async function OwnerGraphicsPage() {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/graphics"));
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#030607] text-white">
      <div className="mx-auto grid min-h-dvh w-full max-w-[120rem] xl:grid-cols-[6.25rem_minmax(0,1fr)]">
        <OwnerProductionSideMenu active="graphics" compact />

        <div className="min-w-0 px-2 pb-2 xl:pt-0">
          <header className="border-b border-white/10 bg-[linear-gradient(180deg,#0b1013,#06090b)] px-4 py-3 shadow-[0_6px_22px_rgba(0,0,0,0.34)]">
            <div className="flex min-h-8 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-headline text-[1.55rem] uppercase leading-none tracking-[0.04em] text-white sm:text-[1.85rem]">
                  Broadcast Graphics
                  <span className="ml-4 align-middle font-ui text-[0.66rem] font-semibold tracking-[0.1em] text-white/45">Data Plane</span>
                </p>
              </div>

              <Link
                href="/owner/cockpit"
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-[2px] border border-[#00b8f5]/65 bg-[#00a8ff]/5 px-4 font-ui text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#16c8ff] transition hover:bg-[#00a8ff]/15 active:translate-y-px"
              >
                <MonitorPlay className="h-4 w-4" />
                Open Cockpit
              </Link>
            </div>
          </header>

          <div className="mt-2">
            <GraphicsSuitePrepClient />
          </div>
        </div>
      </div>
    </main>
  );
}
