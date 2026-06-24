"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

type NavGroup = {
  title: string;
  items: NavLink[];
};

const PRODUCTION_TOOLS: NavGroup = {
  title: "Production Tools",
  items: [
    { label: "Countdown Admin", href: "/ops/countdown" },
    { label: "Broadcast Desk", href: "/dashboard/broadcast" },
    { label: "Live Hub", href: "/ops/live-hub" },
  ],
};

const MONITORING: NavGroup = {
  title: "Monitoring",
  items: [
    { label: "Alerts", href: "#alerts" },
    { label: "Audio Monitor", href: "#audio-monitor" },
    { label: "Stream Health", href: "#stream-health" },
    { label: "Viewers & Chat", href: "#viewers-chat" },
    { label: "Logs", href: "#logs" },
  ],
};

type ProductionDashboardSidebarProps = {
  uptime: string;
  systemHealthy: boolean;
};

function NavSection({ group }: { group: NavGroup }) {
  const pathname = usePathname();

  return (
    <div className="mt-6">
      <p className="mb-2 px-3 font-ui text-[0.48rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
        {group.title}
      </p>
      <ul className="space-y-1">
        {group.items.map((item) => {
          const isActive =
            item.href === "/ops" ||
            item.href === "/ops/production-dashboard"
              ? pathname === "/ops" || pathname === "/ops/production-dashboard"
              : item.href.startsWith("/") && pathname === item.href;

          const className = `block rounded-lg px-3 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] transition ${
            isActive
              ? "bg-brand-blue/15 text-brand-blue border border-brand-blue/30"
              : "text-brand-muted hover:bg-brand-panel hover:text-white"
          }`;

          if (item.href.startsWith("#")) {
            return (
              <li key={item.label}>
                <a href={item.href} className={className}>
                  {item.label}
                </a>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <Link href={item.href} className={className}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarContent({ uptime, systemHealthy }: ProductionDashboardSidebarProps) {
  return (
    <>
      <div className="border-b border-brand-border px-4 py-5">
        <p className="font-headline text-2xl uppercase tracking-[0.28em] text-white">parable</p>
        <p className="mt-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.32em] text-brand-muted">
          STUDIOS
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <Link
          href="/ops"
          className="block rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-3 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-blue"
        >
          Production Dashboard
        </Link>

        <NavSection group={PRODUCTION_TOOLS} />
        <NavSection group={MONITORING} />
      </nav>

      <div className="border-t border-brand-border p-4">
        <div className="rounded-xl border border-brand-border bg-brand-black/50 p-3">
          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
            System Status
          </p>
          <p
            className={`mt-1 font-ui text-[0.56rem] font-bold uppercase tracking-[0.1em] ${
              systemHealthy ? "text-brand-blue" : "text-brand-pink"
            }`}
          >
            {systemHealthy ? "All Systems Operational" : "Attention Required"}
          </p>
          <p className="mt-2 font-mono text-[0.62rem] text-brand-muted">Uptime {uptime}</p>
        </div>
      </div>
    </>
  );
}

export default function ProductionDashboardSidebar({
  uptime,
  systemHealthy,
}: ProductionDashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="touch-target fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-white md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        Menu
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-brand-border bg-brand-panel transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="touch-target absolute right-3 top-3 rounded-lg p-2 text-brand-muted hover:text-white md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <SidebarContent uptime={uptime} systemHealthy={systemHealthy} />
      </aside>
    </>
  );
}
