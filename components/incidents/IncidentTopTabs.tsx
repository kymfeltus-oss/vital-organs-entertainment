"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const INCIDENT_TABS = [
  { label: "Console", href: "/dashboard/broadcast" },
  { label: "Preshow", href: "/production/preshow" },
  { label: "Camera", href: "/ops/camera" },
  { label: "Incident", href: "/dashboard/incidents" },
] as const;

type IncidentTopTabsProps = {
  operatorEmail: string;
  onOpenSettings: () => void;
};

function displayName(email: string): string {
  const local = email.split("@")[0]?.trim() || "Producer";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function IncidentTopTabs({ operatorEmail, onOpenSettings }: IncidentTopTabsProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800/80 bg-[#05070d]">
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 md:px-6">
        <div className="min-w-0">
          <h1 className="font-headline text-xl uppercase tracking-[0.14em] text-white md:text-2xl">
            5. Incident Logs
          </h1>
          <nav
            aria-label="Broadcast studio tabs"
            className="mt-3 flex flex-wrap gap-2"
          >
            {INCIDENT_TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] transition",
                    active
                      ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-[0_0_18px_rgba(138,46,255,0.35)]"
                      : "text-slate-400 hover:text-white",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white">
              {displayName(operatorEmail)}
            </p>
            <p className="font-body text-[0.65rem] text-slate-400">Full Access</p>
          </div>
          <div
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-[#111827] text-xs font-bold text-brand-blue"
          >
            {displayName(operatorEmail).slice(0, 1)}
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open incident settings"
            className="touch-target rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:text-white"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
