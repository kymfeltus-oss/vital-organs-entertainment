"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import AttendeeLiveNavLink from "@/components/navigation/AttendeeLiveNavLink";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PERSONA_HUB_PATH } from "@/lib/auth/routing";
import { isAttendeeLiveSurfacePath, EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { cn } from "@/lib/utils";

export type TenantMenuItem = {
  id: string;
  label: string;
  href: string;
  match?: "exact" | "prefix";
};

export const TENANT_MENU_ITEMS: TenantMenuItem[] = [
  { id: "home", label: "Home", href: ATTENDEE_DASHBOARD_PATH, match: "exact" },
  { id: "live", label: "Live Room", href: EXPERIENCE_LIVE_PATH, match: "prefix" },
  { id: "seed", label: "Giving", href: "/giving", match: "prefix" },
  { id: "music", label: "Music", href: "/music", match: "prefix" },
  { id: "contact", label: "Contact", href: "/contact-us", match: "prefix" },
  { id: "profile", label: "Profile", href: `${ATTENDEE_DASHBOARD_PATH}?view=profile` },
  { id: "settings", label: "Settings", href: `${ATTENDEE_DASHBOARD_PATH}?view=settings` },
];

type TenantMenuButtonProps = {
  className?: string;
  items?: TenantMenuItem[];
};

function isMenuItemActive(pathname: string, item: TenantMenuItem): boolean {
  if (item.id === "live") {
    return isAttendeeLiveSurfacePath(pathname);
  }

  if (!item.match) return false;

  const hrefPath = item.href.split("?")[0] ?? item.href;

  if (item.match === "exact") {
    return pathname === hrefPath;
  }

  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

export default function TenantMenuButton({
  className,
  items = TENANT_MENU_ITEMS,
}: TenantMenuButtonProps) {
  const { theme } = useTheme();
  const panelId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    closeMenu();
  }, [closeMenu, pathname]);

  const handleLogout = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        closeMenu();
        router.push(PERSONA_HUB_PATH);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={cn("awakening-menu-button touch-target", className)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="awakening-menu-icon"
          data-open={open ? "true" : "false"}
          aria-hidden
        >
          <span className="awakening-menu-bar awakening-menu-bar--1" />
          <span className="awakening-menu-bar awakening-menu-bar--2" />
          <span className="awakening-menu-bar awakening-menu-bar--3" />
        </span>
      </button>

      {mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close menu backdrop"
                className={cn(
                  "awakening-menu-backdrop",
                  open && "awakening-menu-backdrop--open",
                )}
                onClick={closeMenu}
                tabIndex={open ? 0 : -1}
              />

              <aside
                id={panelId}
                className={cn(
                  "awakening-menu-panel",
                  open && "awakening-menu-panel--open",
                )}
                aria-hidden={!open}
                inert={!open ? true : undefined}
              >
                <div className="awakening-menu-panel-header">
                  <p
                    className="font-ui text-[0.62rem] font-semibold uppercase tracking-[0.38em]"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    {theme.appName}
                  </p>
                  <p
                    className="mt-1 text-lg font-semibold"
                    style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
                  >
                    Menu
                  </p>
                </div>

                <nav aria-label="Main menu" className="awakening-menu-nav">
                  <ul className="flex flex-col gap-1">
                    {items.map((item) => {
                      const active = isMenuItemActive(pathname, item);
                      const linkClassName = cn(
                        "awakening-menu-link font-ui",
                        active && "awakening-menu-link--active",
                      );

                      return (
                        <li key={item.id}>
                          {item.id === "live" ? (
                            <AttendeeLiveNavLink
                              className={linkClassName}
                              onClick={closeMenu}
                              tabIndex={open ? 0 : -1}
                            >
                              {item.label}
                            </AttendeeLiveNavLink>
                          ) : (
                            <Link
                              href={item.href}
                              className={linkClassName}
                              onClick={closeMenu}
                              tabIndex={open ? 0 : -1}
                            >
                              {item.label}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="awakening-menu-footer">
                  <button
                    type="button"
                    className="awakening-menu-logout font-ui"
                    onClick={(event) => void handleLogout(event)}
                    disabled={isLoggingOut}
                    tabIndex={open ? 0 : -1}
                  >
                    {isLoggingOut ? "Signing out…" : "Logout"}
                  </button>
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
