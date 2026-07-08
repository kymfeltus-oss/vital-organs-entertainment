import type { Metadata } from "next";
import FaithAdminShell from "@/components/admin/faith/FaithAdminShell";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Branding Settings | ${PLATFORM_APP_NAME}`,
  description:
    "PΛRΛBLE FAITH OS white-label customization engine — rename modules, tokens, and liturgical colors per subdomain.",
  robots: { index: false, follow: false },
};

export default function AdminBrandingSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FaithAdminShell>{children}</FaithAdminShell>;
}
