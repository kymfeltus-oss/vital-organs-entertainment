import type { MetadataRoute } from "next";
import { PLATFORM_APP_NAME, PLATFORM_SHORT_NAME, PLATFORM_TAGLINE } from "@/lib/theme/brand";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PLATFORM_APP_NAME,
    short_name: PLATFORM_SHORT_NAME,
    description: PLATFORM_TAGLINE,
    start_url: "/attendee-dashboard",
    scope: "/",
    display: "standalone",
    background_color: DEFAULT_TENANT_THEME.colors.background,
    theme_color: DEFAULT_TENANT_THEME.colors.primary,
    icons: [
      {
        src: "/images/logo.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
