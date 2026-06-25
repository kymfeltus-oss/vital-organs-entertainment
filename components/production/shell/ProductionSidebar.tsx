"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCTION_NAV_SECTIONS } from "@/lib/production/nav";
import { cn } from "@/lib/utils";

export default function ProductionSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-brand-border bg-brand-panel/80">
      <div className="border-b border-brand-border px-4 py-4">
        <p className="font-parable-mono text-[0.48rem] font-black uppercase tracking-[0.16em] text-brand-blue">
          Parable Streaming
        </p>
        <p className="font-headline text-sm uppercase tracking-[0.1em] text-[#00f2ff]">
          Production
        </p>
      </div>

      <nav aria-label="Production navigation" className="flex-1 overflow-y-auto px-2 py-3">
        {PRODUCTION_NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-4">
            <p className="mb-1 px-2 font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/production-dashboard" && pathname.startsWith(`${item.href}/`)) ||
                  (item.href === "/production-dashboard" && pathname === "/production-dashboard");

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.08em] transition",
                        active
                          ? "bg-[#00f2ff]/10 text-[#00f2ff]"
                          : "text-brand-muted hover:bg-black/40 hover:text-white",
                        !item.available && !active && "opacity-70",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#53fc18]"
                        />
                      ) : null}
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-brand-border px-4 py-3">
        <p className="font-body text-[0.65rem] text-brand-muted">Dark mode</p>
      </div>
    </aside>
  );
}
