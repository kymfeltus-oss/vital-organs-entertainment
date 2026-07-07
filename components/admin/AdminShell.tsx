"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Radio,
  Settings2,
  Sparkles,
} from "lucide-react";
import BrandLogo from "@/components/ui/layout/BrandLogo";
import { ADMIN_TIER_LABELS } from "@/lib/admin/tiers";
import type { TenantAdminContext } from "@/lib/admin/types";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: React.ReactNode;
  context: TenantAdminContext;
};

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/settings/branding", label: "Branding", icon: Palette, exact: false },
  { href: "/live", label: "Live preview", icon: Radio, exact: false },
  { href: "/attendee-dashboard", label: "Attendee app", icon: Sparkles, exact: false },
] as const;

export default function AdminShell({ children, context }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div
      className="flex min-h-dvh w-full"
      style={{ background: "var(--theme-app-gradient)", color: "var(--theme-text)" }}
    >
      <aside
        className="hidden w-60 shrink-0 flex-col border-r lg:flex"
        style={{
          borderColor: "var(--theme-border)",
          background: "color-mix(in srgb, var(--theme-surface) 92%, transparent)",
        }}
      >
        <div className="border-b px-4 py-5" style={{ borderColor: "var(--theme-border)" }}>
          <BrandLogo size="sm" />
          <p
            className="mt-3 text-sm font-semibold"
            style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
          >
            Admin Console
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--theme-text-muted)" }}>
            {PLATFORM_APP_NAME}
          </p>
          <span
            className="theme-label mt-3 inline-flex rounded-full px-2.5 py-1"
            style={{
              background: "color-mix(in srgb, var(--theme-primary) 16%, transparent)",
              color: "var(--theme-primary)",
            }}
          >
            {ADMIN_TIER_LABELS[context.tier]} tier
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "theme-card--active" : "hover:bg-white/5",
                )}
                style={{ color: active ? "var(--theme-primary)" : "var(--theme-text-muted)" }}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4 text-xs leading-relaxed" style={{ borderColor: "var(--theme-border)", color: "var(--theme-text-muted)" }}>
          <Settings2 className="mb-2 size-4" aria-hidden="true" />
          Enterprise overrides append on top of your base tier without changing self-service modules.
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
