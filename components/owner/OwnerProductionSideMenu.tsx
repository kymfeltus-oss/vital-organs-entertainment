"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, MonitorDot, Palette, Play, Timer, X } from "lucide-react";

const PRODUCTION_NAV_ITEMS = [
  {
    id: "cockpit",
    label: "Cockpit",
    eyebrow: "Execution deck",
    href: "/owner/cockpit",
    icon: MonitorDot,
  },
  {
    id: "graphics",
    label: "Graphics",
    eyebrow: "Build suite",
    href: "/owner/graphics",
    icon: Palette,
  },
  {
    id: "countdown",
    label: "Countdown",
    eyebrow: "Schedule",
    href: "/owner/countdown",
    icon: Timer,
  },
  {
    id: "camera",
    label: "Camera",
    eyebrow: "Publisher",
    href: "/owner/publish/camera",
    icon: Play,
  },
] as const;

type OwnerProductionSideMenuProps = {
  active: (typeof PRODUCTION_NAV_ITEMS)[number]["id"];
};

export default function OwnerProductionSideMenu({ active }: OwnerProductionSideMenuProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = PRODUCTION_NAV_ITEMS.find((item) => item.id === active) ?? PRODUCTION_NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  return (
    <>
      <nav
        aria-label="Production mobile navigation"
        className="sticky top-2 z-30 rounded-[6px] border border-white/10 bg-[#050814]/96 p-2 shadow-[0_0_28px_rgba(0,168,255,0.16)] backdrop-blur xl:hidden"
      >
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="production-mobile-menu"
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-[#00a8ff]/30 bg-[#00a8ff]/10 px-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-[#00a8ff]/45 bg-[#00a8ff]/15 text-[#00a8ff]">
              <ActiveIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-ui text-[0.52rem] font-black uppercase tracking-[0.16em] text-[#00a8ff]">
                Production
              </span>
              <span className="block truncate font-ui text-[0.72rem] font-black uppercase tracking-[0.1em] text-white">
                {activeItem.label}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-white/65">
            <ChevronDown className={`h-4 w-4 transition ${mobileOpen ? "rotate-180" : ""}`} />
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </span>
        </button>

        {mobileOpen ? (
          <div
            id="production-mobile-menu"
            className="mt-2 grid gap-2 sm:grid-cols-2"
          >
            {PRODUCTION_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex min-h-14 items-center gap-2 rounded-md border px-2.5 py-2 transition ${
                    isActive
                      ? "border-[#00a8ff]/55 bg-[#00a8ff]/12 text-white shadow-[0_0_18px_rgba(0,168,255,0.18)]"
                      : "border-white/8 bg-black/24 text-white/70 hover:border-[#00a8ff]/35 hover:bg-[#00a8ff]/8 hover:text-white"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded border ${
                      isActive
                        ? "border-[#00a8ff]/55 bg-[#00a8ff]/15 text-[#00a8ff]"
                        : "border-white/10 bg-white/[0.03] text-white/55 group-hover:text-[#00a8ff]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-ui text-[0.63rem] font-black uppercase tracking-[0.1em]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate font-body text-[0.56rem] text-white/45">
                      {item.eyebrow}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5">
            {PRODUCTION_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`grid h-12 min-w-12 place-items-center rounded-md border transition ${
                    isActive
                      ? "border-[#00a8ff]/55 bg-[#00a8ff]/15 text-[#00a8ff]"
                      : "border-white/8 bg-black/24 text-white/55 hover:border-[#00a8ff]/35 hover:text-[#00a8ff]"
                  }`}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <nav
        aria-label="Production side navigation"
        className="hidden shrink-0 rounded-[6px] border border-white/10 bg-[#050814]/94 p-2 shadow-[0_0_28px_rgba(0,168,255,0.08)] xl:sticky xl:top-2 xl:flex xl:h-[calc(100dvh-1rem)] xl:w-48 xl:flex-col"
      >
        <div className="border-b border-white/10 px-2 pb-3">
          <p className="font-ui text-[0.54rem] font-black uppercase tracking-[0.16em] text-[#00a8ff]">
            Production
          </p>
          <p className="mt-1 font-headline text-lg uppercase leading-none text-white">
            Side Menu
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {PRODUCTION_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-12 items-center gap-2 rounded-md border px-2.5 py-2 transition ${
                  isActive
                    ? "border-[#00a8ff]/55 bg-[#00a8ff]/12 text-white shadow-[0_0_18px_rgba(0,168,255,0.18)]"
                    : "border-white/8 bg-black/24 text-white/70 hover:border-[#00a8ff]/35 hover:bg-[#00a8ff]/8 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded border ${
                    isActive
                      ? "border-[#00a8ff]/55 bg-[#00a8ff]/15 text-[#00a8ff]"
                      : "border-white/10 bg-white/[0.03] text-white/55 group-hover:text-[#00a8ff]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-ui text-[0.63rem] font-black uppercase tracking-[0.1em]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate font-body text-[0.56rem] text-white/45">
                    {item.eyebrow}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
