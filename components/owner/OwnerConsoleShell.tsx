"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import OwnerConsoleNavLink from "@/components/owner/OwnerConsoleNavLink";

const OWNER_NAV_ITEMS = [
  {
    href: "/owner/countdown",
    icon: "TIME",
    label: "Countdown",
    description: "Event clock and schedule",
  },
  {
    href: "/owner/cockpit",
    icon: "LIVE",
    label: "Cockpit",
    description: "Live production control",
  },
  {
    href: "/owner/graphics",
    icon: "GFX",
    label: "Graphics",
    description: "Broadcast overlay builder",
  },
] as const;

function OwnerNavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1.5" aria-label="Owner workspaces">
      {OWNER_NAV_ITEMS.map((item) => (
        <OwnerConsoleNavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          description={item.description}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export default function OwnerConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const toggleMobileNav = useCallback(() => {
    setMobileNavOpen((open) => !open);
  }, []);

  if (pathname === "/owner/cockpit") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100 md:flex-row">
      <header className="relative block border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={toggleMobileNav}
          aria-expanded={mobileNavOpen}
          aria-controls="owner-mobile-nav"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 font-ui text-lg text-slate-100"
        >
          <span className="sr-only">Toggle owner menu</span>
          {mobileNavOpen ? "X" : "Menu"}
        </button>
        <div className="mx-auto max-w-md pl-16 pr-12 text-center">
          <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.18em] text-sky-400">
            Vital Organs Ent
          </p>
          <h1 className="font-headline text-sm uppercase tracking-[0.1em] text-slate-100">
            Owner Console
          </h1>
        </div>
      </header>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            aria-label="Close owner menu"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={closeMobileNav}
          />
          <aside
            id="owner-mobile-nav"
            className="fixed inset-x-0 top-[3.75rem] z-50 max-h-[calc(100dvh-3.75rem)] overflow-y-auto border-b border-slate-800 bg-slate-950 px-3 py-4 md:hidden"
          >
            <OwnerNavList onNavigate={closeMobileNav} />
          </aside>
        </>
      ) : null}

      <aside className="hidden w-full shrink-0 flex-col border-r border-slate-800 bg-slate-950 md:flex md:w-[13.5rem]">
        <div className="border-b border-slate-800 px-4 py-5">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-sky-400">
            Vital Organs Ent
          </p>
          <h1 className="mt-1 font-headline text-sm uppercase tracking-[0.1em] text-slate-100">
            Owner Console
          </h1>
        </div>

        <div className="flex flex-1 flex-col px-2 py-4">
          <OwnerNavList />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
