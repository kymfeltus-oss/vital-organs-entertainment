"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Album,
  Clock,
  Compass,
  Home,
  Menu,
  Square,
} from "lucide-react";

import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

type ColemanMobileChromeProps = {
  children: React.ReactNode;
  onStopAudio?: () => void;
};

const NAV_ITEMS = [
  { href: COLEMAN_ROUTES.home, label: "HOME", Icon: Home },
  { href: COLEMAN_ROUTES.explore, label: "EXPLORE", Icon: Compass },
  { href: COLEMAN_ROUTES.history, label: "HISTORY", Icon: Clock },
  { href: COLEMAN_ROUTES.library, label: "LIBRARY", Icon: Album },
] as const;

export default function ColemanMobileChrome({
  children,
  onStopAudio,
}: ColemanMobileChromeProps) {
  const pathname = usePathname();

  return (
    <div className="coleman-dashboard relative flex h-full min-h-0 flex-col">
      <div className="coleman-dashboard-bg coleman-luxury-canvas" aria-hidden />

      <header className="coleman-dash-header">
        <Link
          href={COLEMAN_ROUTES.home}
          className="coleman-glass-circle coleman-icon-stroke"
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.25} aria-hidden />
        </Link>
        <div className="coleman-dash-logo-wrap">
          <Link href={COLEMAN_ROUTES.home} aria-label="COLEMAN home">
            <Image
              src="/enterprise/coleman/coleman_logo.png"
              alt=""
              width={220}
              height={72}
              className="coleman-dash-logo"
              priority
            />
          </Link>
        </div>
        <Link href={COLEMAN_ROUTES.library} className="coleman-avatar" aria-label="Open library">
          <span>C</span>
        </Link>
      </header>

      <div className="coleman-dash-scroll flex-1 overflow-y-auto overscroll-contain">
        {children}
        <div className="h-24" />
      </div>

      <nav className="coleman-bottom-nav">
        {NAV_ITEMS.slice(0, 2).map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`coleman-nav-item coleman-icon-stroke${active ? " is-active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.25} />
              <span className={`coleman-nav-label${active ? " is-active" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          className="coleman-center-stop coleman-icon-stroke"
          onClick={onStopAudio}
          aria-label="Stop all audio"
        >
          <Square size={18} strokeWidth={1.25} />
        </button>

        {NAV_ITEMS.slice(2).map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`coleman-nav-item coleman-icon-stroke${active ? " is-active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.25} />
              <span className={`coleman-nav-label${active ? " is-active" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
