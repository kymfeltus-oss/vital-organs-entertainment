"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import {
  getMenuScreenHeaderTitle,
  isMenuScreenHeaderRoute,
  shouldShowMenuHeaderTitle,
} from "@/lib/navigation/menu-screen-header-config";
import {
  MENU_HEADER_ACTIONS_SLOT,
  MENU_HEADER_ARTBOARD,
  MENU_HEADER_BACK_SLOT,
  menuHeaderOverlayRectStyle,
} from "@/lib/navigation/menu-screen-header-slots";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { useMenuScreenProfile } from "@/lib/useMenuScreenProfile";

export default function MenuScreenHeader() {
  const pathname = usePathname();
  const { profile, setProfile } = useMenuScreenProfile();

  if (!isMenuScreenHeaderRoute(pathname)) return null;

  const title = getMenuScreenHeaderTitle(pathname);
  const showTitle = shouldShowMenuHeaderTitle(pathname);

  return (
    <div className="menu-screen-header-shell">
      <header
        className="menu-screen-header"
        aria-label={showTitle ? `${title} navigation` : "Page navigation"}
        style={
          {
            "--menu-header-art-w": MENU_HEADER_ARTBOARD.width,
            "--menu-header-art-h": MENU_HEADER_ARTBOARD.height,
          } as React.CSSProperties
        }
      >
        <div className="menu-screen-header__canvas">
          <Link
            href={ATTENDEE_DASHBOARD_PATH}
            aria-label={MENU_HEADER_BACK_SLOT.label}
            className="artboard-hit-target menu-screen-header__back"
            style={menuHeaderOverlayRectStyle(MENU_HEADER_BACK_SLOT)}
          >
            <span className="sr-only">{MENU_HEADER_BACK_SLOT.label}</span>
          </Link>

          {showTitle ? (
            <h1 className="menu-screen-header__title pointer-events-none absolute left-1/2 top-[1.8%] max-w-[52%] -translate-x-1/2 truncate text-center font-headline text-xs uppercase tracking-[0.35em] text-brand-gradient">
              {title}
            </h1>
          ) : null}

          <div
            className="menu-screen-header__actions pointer-events-auto"
            style={menuHeaderOverlayRectStyle(MENU_HEADER_ACTIONS_SLOT)}
          >
            <ProfileOrbEditor
              profile={profile}
              onProfileChange={setProfile}
              size={36}
            />
            <AwakeningMenuButton className="menu-screen-header__menu shrink-0" />
          </div>
        </div>
      </header>
    </div>
  );
}
