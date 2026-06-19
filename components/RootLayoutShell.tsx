"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { CONTENT_WITH_NAV } from "@/lib/responsive";
import { isNavHiddenRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type RootLayoutShellProps = {
  children: React.ReactNode;
};

export default function RootLayoutShell({ children }: RootLayoutShellProps) {
  const pathname = usePathname();
  const hideNav = isNavHiddenRoute(pathname);
  const experienceSurface =
    pathname === ATTENDEE_DASHBOARD_PATH ||
    pathname === "/experience" ||
    pathname.startsWith("/experience/");
  const isExperienceDashboard = pathname === ATTENDEE_DASHBOARD_PATH;

  return (
    <div
      className={cn(
        "min-h-dvh w-full",
        experienceSurface ? "bg-transparent" : "bg-brand-black",
      )}
    >
      {!hideNav && <BottomNavigation />}
      <div
        className={cn(
          "min-h-dvh w-full",
          !hideNav && !isExperienceDashboard && CONTENT_WITH_NAV,
        )}
      >
        {children}
      </div>
    </div>
  );
}
