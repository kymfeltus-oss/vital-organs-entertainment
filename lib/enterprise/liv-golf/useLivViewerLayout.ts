"use client";

import { useEffect, useState } from "react";

export type LivViewerLayoutMode = "mobile" | "tablet-sidebar" | "desktop-split";

function resolveLayoutMode(): LivViewerLayoutMode {
  if (typeof window === "undefined") return "mobile";

  const width = window.innerWidth;
  const landscape = window.matchMedia("(orientation: landscape)").matches;

  if (width >= 1024) return "desktop-split";
  if (width >= 768 && landscape) return "tablet-sidebar";
  return "mobile";
}

/** Responsive layout for LIV fan viewer — stack, tablet sidebar, desktop 70/30. */
export function useLivViewerLayout(): LivViewerLayoutMode {
  const [mode, setMode] = useState<LivViewerLayoutMode>("mobile");

  useEffect(() => {
    const update = () => setMode(resolveLayoutMode());
    update();

    window.addEventListener("resize", update);
    const landscapeQuery = window.matchMedia("(orientation: landscape)");
    landscapeQuery.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      landscapeQuery.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
