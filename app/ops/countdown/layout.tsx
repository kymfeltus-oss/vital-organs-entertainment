import { requireCrewModuleAccess } from "@/lib/ops/require-crew-module-access";
import ProductionDashboardBackLink from "@/components/ops/ProductionDashboardBackLink";

export default async function OpsCountdownLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCrewModuleAccess("countdown_editor", "/ops/countdown");
  return (
    <div className="min-h-dvh bg-brand-black">
      <div className="border-b border-brand-border px-4 py-3 md:px-6">
        <ProductionDashboardBackLink />
      </div>
      {children}
    </div>
  );
}
