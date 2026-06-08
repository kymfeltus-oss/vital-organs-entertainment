"use client";

import { usePathname } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import { CONTENT_WITH_NAV } from "@/lib/responsive";
import { isNavHiddenRoute } from "@/lib/routes";

type RootLayoutShellProps = {
  children: React.ReactNode;
};

export default function RootLayoutShell({ children }: RootLayoutShellProps) {
  const pathname = usePathname();
  const hideNav = isNavHiddenRoute(pathname);

  return (
    <div className="min-h-dvh w-full bg-[#0B090A]">
      {!hideNav && <AppNavigation />}
      <div className={hideNav ? "min-h-dvh w-full" : `min-h-dvh w-full ${CONTENT_WITH_NAV}`}>
        {children}
      </div>
    </div>
  );
}
