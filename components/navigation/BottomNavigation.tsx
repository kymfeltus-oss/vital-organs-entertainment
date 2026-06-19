"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  BOTTOM_MENU_ARTBOARD,
  BOTTOM_MENU_BAR_SRC,
  BOTTOM_NAV_HOTSPOTS,
  BOTTOM_NAV_PILL_INSET,
} from "@/lib/navigation/bottom-nav-config";

export default function BottomNavigation() {
  const pathname = usePathname();
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const styles = getComputedStyle(frame);

    const probe = new window.Image();
    probe.onload = () => {
      const artImg = frame.querySelector(".bottom-nav__art") as HTMLImageElement | null;
      const artStyles = artImg ? getComputedStyle(artImg) : null;
      const frameAspect = rect.width / rect.height;
      const artAspect = probe.naturalWidth / probe.naturalHeight;

      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
        body: JSON.stringify({
          sessionId: "baf5b9",
          runId: "nav-distortion-debug",
          hypothesisId: "NAV-H3",
          location: "BottomNavigation.tsx:assetProbe",
          message: "bottom nav render metrics",
          data: {
            pathname,
            loadedSrc: probe.src,
            naturalWidth: probe.naturalWidth,
            naturalHeight: probe.naturalHeight,
            assetMatchesArtboard:
              probe.naturalWidth === BOTTOM_MENU_ARTBOARD.width &&
              probe.naturalHeight === BOTTOM_MENU_ARTBOARD.height,
            fullWidthAsset: probe.naturalWidth === 1290 && probe.naturalHeight === 192,
            frameHeight: Math.round(rect.height),
            frameWidth: Math.round(rect.width),
            frameAspect: Number(frameAspect.toFixed(4)),
            artAspect: Number(artAspect.toFixed(4)),
            aspectMismatch: Math.abs(frameAspect - artAspect) > 0.02,
            artClientWidth: artImg?.clientWidth ?? null,
            artClientHeight: artImg?.clientHeight ?? null,
            objectFit: artStyles?.objectFit ?? null,
            frameBorderRadius: styles.borderRadius,
            frameOverflow: styles.overflow,
            devicePixelRatio: window.devicePixelRatio,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };
    probe.onerror = () => {
      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
        body: JSON.stringify({
          sessionId: "baf5b9",
          runId: "nav-blueprint-verify",
          hypothesisId: "NAV-ASSET-SIZE",
          location: "BottomNavigation.tsx:assetProbe",
          message: "bottom nav asset failed to load",
          data: { src: BOTTOM_MENU_BAR_SRC, pathname },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };
    probe.src = BOTTOM_MENU_BAR_SRC;

    const hotspots = frame.querySelector(".bottom-nav__hotspots");
    const hotspotsRect = hotspots?.getBoundingClientRect();
    const artImg = frame.querySelector(".bottom-nav__art") as HTMLImageElement | null;

    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "nav-blueprint-final",
        hypothesisId: "NAV-BLUEPRINT",
        location: "BottomNavigation.tsx:metrics",
        message: "bottom nav blueprint layout",
        data: {
          pathname,
          frameHeight: Math.round(rect.height),
          frameWidth: Math.round(rect.width),
          frameBottom: Math.round(window.innerHeight - rect.bottom),
          borderRadius: styles.borderRadius,
          zIndex: styles.zIndex,
          hasArtImg: Boolean(artImg),
          artImgSrc: artImg?.currentSrc ?? null,
          hotspotsWidth: hotspotsRect ? Math.round(hotspotsRect.width) : null,
          hotspotsLeft: hotspotsRect ? Math.round(hotspotsRect.left - rect.left) : null,
          pillInsetLeftPct: BOTTOM_NAV_PILL_INSET.left,
          pillInsetWidthPct: BOTTOM_NAV_PILL_INSET.width,
          artboard: BOTTOM_MENU_ARTBOARD,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [pathname]);

  return (
    <nav aria-label="Primary" className="bottom-nav">
      <div ref={frameRef} className="bottom-nav__frame">
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
