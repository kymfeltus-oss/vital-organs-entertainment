"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  EXPERIENCE_DASHBOARD_NAV,
  type ExperienceNavItem,
} from "@/lib/experience/awakening-dashboard-assets";

function isNavActive(pathname: string, item: ExperienceNavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type ExperienceDashboardNavProps = {
  variant: "rail" | "bottom";
};

export default function ExperienceDashboardNav({
  variant,
}: ExperienceDashboardNavProps) {
  const pathname = usePathname();

  if (variant === "rail") {
    return (
      <nav
        aria-label="Experience navigation"
        className="effects-lite fixed inset-y-0 left-0 z-50 hidden w-20 flex-col items-center border-r border-brand-border bg-brand-panel/90 py-6 backdrop-blur-md md:flex"
      >
        <Link href="/experience" className="mb-8 touch-target flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={EXPERIENCE_DASHBOARD_NAV[0].icon}
            alt="300 Awakening"
            className="h-10 w-10 object-contain"
          />
        </Link>

        <ul className="flex flex-1 flex-col items-center gap-2">
          {EXPERIENCE_DASHBOARD_NAV.map((item) => {
            const active = isNavActive(pathname, item);

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group relative touch-target flex w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  {active ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/awakening/ui/nav-active-pill.png"
                        alt=""
                        aria-hidden
                        className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
                      />
                    </>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.icon}
                    alt=""
                    aria-hidden
                    className={`relative z-10 h-6 w-6 object-contain ${item.id === "home" ? "h-7 w-7" : ""}`}
                  />
                  <span
                    className={`relative z-10 font-ui text-[9px] font-semibold uppercase tracking-[0.14em] ${
                      active ? "text-brand-blue" : "text-brand-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Experience navigation"
      className="effects-lite fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-brand-panel/95 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="grid h-[4.5rem] grid-cols-5 items-center px-1">
        {EXPERIENCE_DASHBOARD_NAV.map((item) => {
          const active = isNavActive(pathname, item);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative touch-target mx-auto flex h-14 w-full max-w-[4.5rem] flex-col items-center justify-center gap-0.5"
              >
                {active ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/awakening/ui/nav-active-pill.png"
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute inset-x-1 top-1 h-10 object-contain opacity-90"
                    />
                  </>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden
                  className={`relative z-10 object-contain ${item.id === "home" ? "h-7 w-7" : "h-5 w-5"}`}
                />
                <span
                  className={`relative z-10 font-ui text-[8px] font-semibold uppercase tracking-[0.12em] ${
                    active ? "text-brand-blue" : "text-brand-muted"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
