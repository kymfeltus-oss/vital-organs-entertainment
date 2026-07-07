import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getTenantTheme } from "@/lib/theme/tenant-resolver";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headerStore = await headers();
  const tenantId = headerStore.get("x-tenant-id") || "default";
  const theme = await getTenantTheme(tenantId);
  const logoSrc = theme.logoUrl || "/tenant-default/dashboard/logo.png";

  return {
    name: theme.appName,
    short_name: theme.appName,
    description: `Access live streams and video content on the ${theme.appName} framework.`,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: theme.colors.primary,
    icons: [
      {
        src: logoSrc,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: logoSrc,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
