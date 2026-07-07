import type { Metadata } from "next";
import AdminHubClient from "@/components/admin/AdminHubClient";
import { resolveAdminContext } from "@/lib/admin/resolve-admin-context";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Admin Dashboard | ${PLATFORM_APP_NAME}`,
  description: "Self-service white-label admin console for Parable Streaming tenants.",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  const context = resolveAdminContext();

  return (
    <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col">
      <AdminHubClient context={context} />
    </main>
  );
}
