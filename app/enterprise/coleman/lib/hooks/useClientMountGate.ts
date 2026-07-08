"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the browser window layer exists.
 * Guards router actions and Web Audio / getUserMedia from SSR pre-render.
 */
export function useClientMountGate(): boolean {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  return isClientReady;
}
