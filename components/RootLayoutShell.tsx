"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { CONTENT_WITH_NAV } from "@/lib/responsive";
import { isNavHiddenRoute } from "@/lib/routes";

type RootLayoutShellProps = {
  children: React.ReactNode;
};

export default function RootLayoutShell({ children }: RootLayoutShellProps) {
  const pathname = usePathname();
  const hideNav = isNavHiddenRoute(pathname);
  const experienceSurface =
    pathname === "/experience" || pathname.startsWith("/experience/");
  const isExperienceDashboard = pathname === "/experience";
  const contentClass = hideNav
    ? "min-h-dvh w-full"
    : isExperienceDashboard
      ? "min-h-dvh w-full"
      : `min-h-dvh w-full ${CONTENT_WITH_NAV}`;

  return (
    <div className={`min-h-dvh w-full ${experienceSurface ? "bg-transparent" : "bg-brand-black"}`}>
      {!hideNav && <BottomNavigation />}
      <div className={contentClass}>{children}</div>
    </div>
  );
}
