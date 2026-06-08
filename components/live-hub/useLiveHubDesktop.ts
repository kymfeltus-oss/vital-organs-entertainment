"use client";

import { useSyncExternalStore } from "react";
import { LIVE_HUB_DESKTOP_MIN_WIDTH_PX } from "@/lib/live-hub/types";

function subscribeDesktop(onStoreChange: () => void): () => void {
  const media = window.matchMedia(`(min-width: ${LIVE_HUB_DESKTOP_MIN_WIDTH_PX}px)`);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot(): boolean {
  return window.matchMedia(`(min-width: ${LIVE_HUB_DESKTOP_MIN_WIDTH_PX}px)`).matches;
}

function getDesktopServerSnapshot(): boolean {
  return false;
}

export function useLiveHubDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );
}

export function useLiveHubDesktopReady(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
