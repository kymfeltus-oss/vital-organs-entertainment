import ParableProductionRoot from "@/components/parable/ParableProductionRoot";
import ProductionLayoutClient from "@/components/production/shell/ProductionLayoutClient";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export default async function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOpsAdminUser("/production");

  return (
    <ParableProductionRoot>
      <ProductionLayoutClient operatorEmail={user.email ?? "producer"}>
        {children}
      </ProductionLayoutClient>
    </ParableProductionRoot>
  );
}
