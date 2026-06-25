"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { OPS_MODULE_ROUTES, OPS_SHELL_MODULES } from "@/lib/ops/ops-module-nav";
import { cn } from "@/lib/utils";

type OpsShellProps = {
  children: ReactNode;
};

function isModuleActive(pathname: string, moduleHref: string): boolean {
  const modulePath = moduleHref.split("?")[0] ?? moduleHref;
  if (modulePath === OPS_MODULE_ROUTES.productionDashboard) {
    return (
      pathname === "/ops" ||
      pathname === OPS_MODULE_ROUTES.productionDashboard ||
      pathname === "/ops/production-dashboard"
    );
  }
  return pathname === modulePath || pathname.startsWith(`${modulePath}/`);
}

function ShellNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Ops modules" className="flex-1 space-y-1 px-2 py-4">
      {OPS_SHELL_MODULES.map((module) => {
        const active = isModuleActive(pathname, module.href);
        return (
          <Link
            key={module.id}
            href={module.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-lg px-3 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] transition",
              active
                ? "border border-brand-blue/30 bg-brand-blue/15 text-brand-blue"
                : "border border-transparent text-brand-muted hover:bg-brand-panel hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
          >
            {module.label}
          </Link>
        );
      })}

      <div className="mt-6 border-t border-brand-border pt-4">
        <Link
          href="/dashboard/broadcast"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-purple transition hover:bg-brand-purple/10"
        >
          Broadcast Desk →
        </Link>
      </div>
    </nav>
  );
}

export default function OpsShell({ children }: OpsShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-brand-black text-white md:h-screen">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="touch-target fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-white md:hidden"
        aria-label="Open ops navigation"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        Ops
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-brand-border bg-brand-panel transition-transform duration-200 md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-5">
            <div>
              <p className="font-headline text-xl uppercase tracking-[0.28em] text-white">parable</p>
              <p className="mt-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.32em] text-brand-muted">
                OPS
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="touch-target rounded-lg p-2 text-brand-muted hover:text-white md:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <ShellNav onNavigate={() => setMobileOpen(false)} />

          <div className="mt-auto border-t border-brand-border p-4">
            <p className="font-ui text-[0.48rem] uppercase tracking-[0.14em] text-brand-muted">
              4-module ops console
            </p>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
