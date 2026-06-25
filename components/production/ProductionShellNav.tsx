"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCTION_TABS = [
  { label: "Console", href: "/production-dashboard" },
  { label: "Preshow", href: "/production/preshow" },
  { label: "Camera", href: "/production/camera" },
  { label: "Sound", href: "/production/sound-control" },
  { label: "Incident", href: "/production/incident" },
] as const;

type ProductionShellNavProps = {
  operatorEmail: string;
};

function displayProducerName(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "Producer";
  return local.replace(/[._-]+/g, " ").toUpperCase();
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ProductionShellNav({ operatorEmail }: ProductionShellNavProps) {
  const pathname = usePathname();
  const producerName = displayProducerName(operatorEmail);

  return (
    <header className="border-b border-brand-border bg-brand-black">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <nav
          aria-label="Production modules"
          className="flex items-end gap-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PRODUCTION_TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative shrink-0 pb-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] transition",
                  active ? "text-white" : "text-brand-muted hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.65)]"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
              {producerName}
            </p>
            <p className="font-body text-[0.65rem] text-brand-muted">Full Access</p>
          </div>
          <div
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-panel text-xs font-bold text-brand-blue"
          >
            {producerName.slice(0, 1)}
          </div>
          <button
            type="button"
            aria-label="Production settings"
            className="touch-target rounded-lg border border-brand-border p-2 text-brand-muted transition hover:text-white"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
