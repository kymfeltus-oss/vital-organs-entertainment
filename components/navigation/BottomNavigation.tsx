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
    <nav aria-label="Primary" className="bottom-dock">
      <div className="bottom-dock__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BOTTOM_MENU_BAR_SRC}
          alt=""
          aria-hidden="true"
          width={BOTTOM_MENU_ARTBOARD.width}
          height={BOTTOM_MENU_ARTBOARD.height}
          className="bottom-dock__art"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
        />
        <div className="bottom-dock__hotspots">
          {BOTTOM_NAV_HOTSPOTS.map((item) => {
            const active = item.isActive(pathname);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`bottom-dock__hit touch-target${active ? " bottom-dock__hit--active" : ""}`}
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
