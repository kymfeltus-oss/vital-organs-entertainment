"use client";

import { useEffect, useState } from "react";
import { useMobileLandscape } from "@/lib/experience/useMobileLandscape";

/** True on phone/tablet portrait — cinematic band + chat-only grid. */
export function useMobilePortraitLayout(): boolean {
  const isMobileLandscape = useMobileLandscape();
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isNarrow && !isMobileLandscape;
}
