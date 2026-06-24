import ProductionDashboardBackLink from "@/components/ops/ProductionDashboardBackLink";

export default function LiveHubSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-brand-black">
      <div className="border-b border-brand-border px-4 py-3 md:px-6">
        <ProductionDashboardBackLink />
      </div>
      {children}
    </div>
  );
}
