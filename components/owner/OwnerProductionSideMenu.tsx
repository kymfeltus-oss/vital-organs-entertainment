"use client";

import { useState } from "react";
import Link from "next/link";
import { AudioLines, ChevronDown, Menu, MonitorDot, Palette, Play, Settings2, Timer, X } from "lucide-react";

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
    id: "sound",
    label: "Sound",
    eyebrow: "X32 control",
    href: "/owner/sound",
    icon: AudioLines,
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
  {
    id: "branding",
    label: "Branding",
    eyebrow: "White-label",
    href: "/owner/settings/branding",
    icon: Settings2,
  },
] as const;

type OwnerProductionSideMenuProps = {
  active: (typeof PRODUCTION_NAV_ITEMS)[number]["id"];
  showEncoderProfile?: boolean;
  compact?: boolean;
};

function EncoderProfileSidebarNote() {
  return (
    <div className="mt-auto space-y-2 border-t border-white/10 pt-3">
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded border border-lime-300/35 bg-lime-300/10 px-2 py-1 font-ui text-[0.48rem] font-black uppercase tracking-[0.08em] text-lime-300">
        <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(132,255,75,0.8)]" />
        Auto-Leveling Matrix: ACTIVE
      </span>
      <label className="flex cursor-default items-start gap-2 rounded-md border border-white/10 bg-black/24 px-2 py-2">
        <input
          type="checkbox"
          checked
          readOnly
          disabled
          aria-label="Gospel profile enabled"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#00a8ff]"
        />
        <span className="font-body text-[0.56rem] leading-snug text-white/72">
          Gospel Profile Enabled: Target master output to -16 LUFS (-14dBFS on surges). Keep hardware
          brick-wall limiter engaged at -2dBFS.
        </span>
      </label>
    </div>
  );
}

export default function OwnerProductionSideMenu({
  active,
  showEncoderProfile = false,
  compact = false,
}: OwnerProductionSideMenuProps) {
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
            {showEncoderProfile ? (
              <div className="sm:col-span-2">
                <EncoderProfileSidebarNote />
              </div>
            ) : null}
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
        className={`hidden shrink-0 overflow-hidden rounded-[3px] border border-white/10 bg-[linear-gradient(180deg,#090e12,#05080a)] shadow-[0_0_28px_rgba(0,168,255,0.08)] xl:sticky xl:top-0 xl:flex xl:h-dvh xl:flex-col ${compact ? "xl:w-[6.25rem]" : "p-2 xl:w-48"}`}
      >
        <div className={`${compact ? "sr-only" : "border-b border-white/10 px-2 pb-3"}`}>
          <p className="font-ui text-[0.54rem] font-black uppercase tracking-[0.16em] text-[#00a8ff]">
            Production
          </p>
          <p className="mt-1 font-headline text-lg uppercase leading-none text-white">
            Side Menu
          </p>
        </div>

        <div className={`${compact ? "flex flex-1 flex-col" : "mt-3 flex flex-col gap-2"}`}>
          {PRODUCTION_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center transition ${compact ? "min-h-[7.5rem] flex-col justify-center gap-3 border-x-0 border-b border-t-0 px-1 py-3 text-center" : "min-h-12 gap-2 rounded-md border px-2.5 py-2"} ${
                  isActive
                    ? "border-[#00a8ff]/55 bg-[#00a8ff]/12 text-white shadow-[0_0_18px_rgba(0,168,255,0.18)]"
                    : "border-white/8 bg-black/24 text-white/70 hover:border-[#00a8ff]/35 hover:bg-[#00a8ff]/8 hover:text-white"
                }`}
              >
                <span
                  className={`grid shrink-0 place-items-center ${compact ? "h-10 w-10 border-0" : "h-8 w-8 rounded border"} ${
                    isActive
                      ? "border-[#00a8ff]/55 bg-[#00a8ff]/15 text-[#00a8ff]"
                      : "border-white/10 bg-white/[0.03] text-white/55 group-hover:text-[#00a8ff]"
                  }`}
                >
                    <Icon className={compact ? "h-8 w-8" : "h-4 w-4"} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate font-ui font-black uppercase ${compact ? "text-[0.64rem] tracking-[0.08em]" : "text-[0.63rem] tracking-[0.1em]"}`}>
                      {item.label}
                    </span>
                    <span className={`${compact ? "sr-only" : "mt-0.5 block truncate font-body text-[0.56rem] text-white/45"}`}>
                    {item.eyebrow}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        {showEncoderProfile ? <EncoderProfileSidebarNote /> : null}
      </nav>
    </>
  );
}
