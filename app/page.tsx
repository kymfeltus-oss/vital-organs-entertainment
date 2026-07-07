import { headers } from "next/headers";
import PlatformLandingPage from "@/components/admin/PlatformLandingPage";
import IntroMediaSplash from "@/components/features/intro/IntroMediaSplash";
import { getTenantTheme } from "@/lib/theme/tenant-resolver";

export default async function RootPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get("x-tenant-id");

  const hasActiveTenantSubdomain = (id: string | null) => {
    return id && id !== "" && id !== "default";
  };

  if (hasActiveTenantSubdomain(tenantId)) {
    const theme = await getTenantTheme(tenantId!);
    return (
      <main className="min-h-screen w-full bg-black">
        <IntroMediaSplash tenantTheme={theme} />
      </main>
    );
  }

  return <PlatformLandingPage />;
}
