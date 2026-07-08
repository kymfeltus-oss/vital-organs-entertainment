"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { isNavHiddenRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type RootLayoutShellProps = {
  children: React.ReactNode;
};

export default function RootLayoutShell({ children }: RootLayoutShellProps) {
  const pathname = usePathname();
  const hideNav = isNavHiddenRoute(pathname);
  const isDashboard = pathname === ATTENDEE_DASHBOARD_PATH;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        hideNav ? "h-dvh max-h-dvh overflow-hidden" : "min-h-dvh",
      )}
      style={{ background: "var(--theme-app-gradient)", color: "var(--theme-text)" }}
    >
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col",
          hideNav && "overflow-hidden",
          !hideNav && !isDashboard && "pb-[calc(3.25rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </div>
      {!hideNav ? <BottomNavigation /> : null}
    </div>
  );
}
