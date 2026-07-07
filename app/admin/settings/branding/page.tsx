import type { Metadata } from "next";
import BrandingCustomizerClient from "@/components/admin/branding/BrandingCustomizerClient";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Branding Settings | ${PLATFORM_APP_NAME}`,
  description: "Configure app branding, colors, contact details, and feature visibility.",
  robots: { index: false, follow: false },
};

export default function AdminBrandingSettingsPage() {
  return (
    <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col">
      <BrandingCustomizerClient />
    </main>
  );
}
