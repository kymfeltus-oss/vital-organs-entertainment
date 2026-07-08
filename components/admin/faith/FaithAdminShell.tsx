"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  Palette,
  ScrollText,
  Shield,
  Users,
  UserSquare2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  enabled?: boolean;
};

const SYSTEM_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/admin/networks", label: "Organizations", icon: Building2, enabled: true },
  { href: "#", label: "Users", icon: Users, enabled: false },
  { href: "#", label: "Roles", icon: UserSquare2, enabled: false },
  { href: "#", label: "Audit Log", icon: ScrollText, enabled: false },
];

const CONFIG_NAV: NavItem[] = [
  { href: "/admin/settings/branding", label: "Branding", icon: Palette, enabled: true },
  { href: "#", label: "Integrations", icon: Globe, enabled: false },
  { href: "#", label: "Security", icon: Shield, enabled: false },
  { href: "#", label: "Localization", icon: FileText, enabled: false },
  { href: "#", label: "Billing", icon: CreditCard, enabled: false },
];

const SUPPORT_NAV: NavItem[] = [
  { href: "#", label: "Documentation", icon: BookOpen, enabled: false },
  { href: "/contact-us", label: "Contact Support", icon: LifeBuoy, enabled: true },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-600">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const className = cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
            active
              ? "bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]"
              : item.enabled
                ? "text-neutral-400 hover:bg-white/5 hover:text-white"
                : "text-neutral-700 cursor-not-allowed",
          );

          const content = (
            <>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </>
          );

          return (
            <li key={item.label}>
              {item.enabled ? (
                <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
                  {content}
                </Link>
              ) : (
                <span className={className} aria-disabled="true">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function FaithAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh w-full bg-[#0b0b0b] text-white">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-900 bg-[#080808] lg:flex">
        <div className="border-b border-neutral-900 px-5 py-6">
          <p className="font-mono text-[11px] font-bold tracking-[0.35em] text-white">
            PΛRΛBLE
          </p>
          <p className="font-mono text-[10px] tracking-[0.22em] text-[#FFB800]">FAITH OS</p>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4" aria-label="Faith admin">
          <NavSection title="System" items={SYSTEM_NAV} pathname={pathname} />
          <NavSection title="Configuration" items={CONFIG_NAV} pathname={pathname} />
          <NavSection title="Support" items={SUPPORT_NAV} pathname={pathname} />
        </nav>

        <div className="border-t border-neutral-900 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-950 px-3 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#FFB800]/15 text-xs font-bold text-[#FFB800]">
              PF
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">Parable Faith OS</p>
              <p className="truncate text-[10px] text-neutral-500">System Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
