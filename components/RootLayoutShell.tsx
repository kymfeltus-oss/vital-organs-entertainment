"use client";

import { useEffect } from "react";
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
  const experienceSurface =
    pathname === "/experience" || pathname.startsWith("/experience/");

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "initial",
        hypothesisId: "B",
        location: "RootLayoutShell.tsx:mount",
        message: "RootLayoutShell hydrated",
        data: {
          pathname,
          domContentLoadedMs: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
          loadEventEndMs: nav ? nav.loadEventEnd - nav.startTime : null,
          responseEndMs: nav ? nav.responseEnd - nav.startTime : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const el = (entry as PerformanceEntry & { element?: Element }).element;
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
          body: JSON.stringify({
            sessionId: "baf5b9",
            runId: "initial",
            hypothesisId: "D",
            location: "RootLayoutShell.tsx:lcp",
            message: "LCP observed",
            data: {
              pathname,
              startTimeMs: entry.startTime,
              renderTimeMs: (entry as PerformanceEntry & { renderTime?: number }).renderTime ?? null,
              loadTimeMs: (entry as PerformanceEntry & { loadTime?: number }).loadTime ?? null,
              tagName: el?.tagName ?? null,
              textPreview: el?.textContent?.slice(0, 80) ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
    });

    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      /* unsupported */
    }

    return () => lcpObserver.disconnect();
  }, [pathname]);

  return (
    <div className={`min-h-dvh w-full ${experienceSurface ? "bg-transparent" : "bg-[#0B090A]"}`}>
      {!hideNav && <AppNavigation />}
      <div className={hideNav ? "min-h-dvh w-full" : `min-h-dvh w-full ${CONTENT_WITH_NAV}`}>
        {children}
      </div>
    </div>
  );
}
