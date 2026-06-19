"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BOTTOM_MENU_ARTBOARD,
  BOTTOM_MENU_BAR_SRC,
  BOTTOM_NAV_HOTSPOTS,
} from "@/lib/navigation/bottom-nav-config";

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="bottom-nav">
      <div className="bottom-nav__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BOTTOM_MENU_BAR_SRC}
          alt=""
          aria-hidden="true"
          width={BOTTOM_MENU_ARTBOARD.width}
          height={BOTTOM_MENU_ARTBOARD.height}
          className="bottom-nav__art"
          decoding="async"
          draggable={false}
        />
        <div className="bottom-nav__hotspots">
          {BOTTOM_NAV_HOTSPOTS.map((item) => {
            const active = item.isActive(pathname);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`bottom-nav__hit touch-target${active ? " bottom-nav__hit--active" : ""}`}
              >
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
