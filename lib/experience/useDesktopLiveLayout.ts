"use client";

import { useEffect, useState } from "react";

/** True at `md` breakpoint and above — desktop IG live split layout. */
export function useDesktopLiveLayout(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
