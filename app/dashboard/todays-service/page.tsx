import { Suspense } from "react";
import HeaderActionsSkeleton from "@/components/todays-service/HeaderActionsSkeleton";
import ServiceHeaderTitle from "@/components/todays-service/ServiceHeaderTitle";
import { SLOT_ID } from "@/components/todays-service/ServiceHeaderActionsPortal";
import TodaysServiceDashboardLoader from "@/components/todays-service/TodaysServiceDashboardLoader";
import TodaysServiceDashboardSkeleton from "@/components/todays-service/TodaysServiceDashboardSkeleton";
import TodaysServiceShell from "@/components/todays-service/TodaysServiceShell";
import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";
import { getOrCreateTodayService } from "@/lib/todays-service/repository";
import { TODAYS_SERVICE_SHELL as SHELL } from "@/lib/todays-service/shell-styles";
import { DEFAULT_SERVICE_TENANT_ID } from "@/lib/todays-service/types";

export const metadata = {
  title: "Today's Service | Parable",
  description: "Prepare for church service and begin with confidence.",
};

export default async function TodaysServicePage() {
  const [ctx, service] = await Promise.all([
    requireCrewModuleAccess("readiness", "/dashboard/todays-service"),
    getOrCreateTodayService(DEFAULT_SERVICE_TENANT_ID),
  ]);
  const operatorEmail = ctx.user.email ?? "volunteer@300a.com";

  return (
    <TodaysServiceShell operatorEmail={operatorEmail}>
      <div className={SHELL.content}>
        <header className={`${SHELL.headerRow} grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]`}>
          <ServiceHeaderTitle service={service} />
          <div id={SLOT_ID} className="flex min-h-[44px] flex-wrap items-start gap-3">
            <HeaderActionsSkeleton />
          </div>
        </header>

        <Suspense fallback={<TodaysServiceDashboardSkeleton />}>
          <TodaysServiceDashboardLoader operatorEmail={operatorEmail} serviceId={service.id} />
        </Suspense>
      </div>
    </TodaysServiceShell>
  );
}
