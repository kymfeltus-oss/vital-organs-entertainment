import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OwnerBrandingSettingsClient from "@/components/production/settings/OwnerBrandingSettingsClient";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Branding Settings | Owner | ${PLATFORM_APP_NAME}`,
  description: "Configure white-label identity, assets, palette tokens, and feature gates.",
  robots: { index: false, follow: false },
};

export default async function OwnerBrandingSettingsPage() {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/settings/branding"));
  }

  return (
    <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col">
      <OwnerBrandingSettingsClient />
    </main>
  );
}
