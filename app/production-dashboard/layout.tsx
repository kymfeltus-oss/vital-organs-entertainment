import ParableProductionRoot from "@/components/parable/ParableProductionRoot";

export default function ProductionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ParableProductionRoot>{children}</ParableProductionRoot>;
}
