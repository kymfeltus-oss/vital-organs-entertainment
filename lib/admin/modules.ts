import { hasAdminCapability, minimumTierForCapability } from "@/lib/admin/tiers";
import { ADMIN_TIER_LABELS } from "@/lib/admin/tiers";
import type { AdminModule, AdminModuleStatus, TenantAdminContext } from "@/lib/admin/types";

const MODULE_CATALOG: Omit<AdminModule, "status" | "tierLabel">[] = [
  {
    id: "branding",
    title: "Branding & Theme",
    description: "App name, tagline, colors, logos, and live preview.",
    href: "/admin/settings/branding",
    icon: "palette",
    requiredCapability: "branding.identity",
  },
  {
    id: "features",
    title: "Feature Visibility",
    description: "Toggle live, giving, music, seeds, and contact modules.",
    href: "/admin/settings/branding?focus=features",
    icon: "sliders",
    requiredCapability: "features.visibility",
  },
  {
    id: "contact",
    title: "Contact & Social",
    description: "Support email, website, and social link management.",
    href: "/admin/settings/branding?focus=contact",
    icon: "share",
    requiredCapability: "contact.socials",
  },
  {
    id: "live-preview",
    title: "Live & Holding Room",
    description: "Preview attendee live surfaces and holding-room countdown.",
    href: "/live",
    icon: "radio",
    requiredCapability: "live.preview",
  },
  {
    id: "analytics",
    title: "Engagement Overview",
    description: "Attendance, seeds, and chat activity snapshots.",
    href: "/admin/analytics",
    icon: "chart",
    requiredCapability: "analytics.overview",
  },
  {
    id: "enterprise-theme",
    title: "Enterprise Theme Overrides",
    description: "Custom CSS variables, fonts, and white-label edge cases.",
    href: "/admin/enterprise/theme",
    icon: "sparkles",
    requiredCapability: "enterprise.custom-theme",
  },
  {
    id: "enterprise-api",
    title: "API & Integration Overrides",
    description: "Webhook targets, playback URLs, and dedicated ingest keys.",
    href: "/admin/enterprise/integrations",
    icon: "plug",
    requiredCapability: "enterprise.api-overrides",
  },
];

function resolveModuleStatus(
  context: TenantAdminContext,
  capability: AdminModule["requiredCapability"],
  moduleId: string,
): AdminModuleStatus {
  if (hasAdminCapability(context, capability)) {
    if (moduleId === "analytics") return "coming-soon";
    if (moduleId.startsWith("enterprise-") && context.tier !== "enterprise") {
      return "coming-soon";
    }
    return "available";
  }
  return "locked";
}

export function listAdminModules(context: TenantAdminContext): AdminModule[] {
  return MODULE_CATALOG.map((module) => {
    const minTier = minimumTierForCapability(module.requiredCapability);
    return {
      ...module,
      tierLabel: ADMIN_TIER_LABELS[minTier],
      status: resolveModuleStatus(context, module.requiredCapability, module.id),
    };
  });
}

export function countAvailableModules(context: TenantAdminContext): number {
  return listAdminModules(context).filter((module) => module.status === "available").length;
}
