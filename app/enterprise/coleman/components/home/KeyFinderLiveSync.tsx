"use client";

import { useEffect } from "react";

type KeyFinderLiveSyncProps = {
  announcement: string;
};

/** Keeps the SSR `#coleman-key-finder-status` span in sync with live pitch state. */
export default function KeyFinderLiveSync({ announcement }: KeyFinderLiveSyncProps) {
  useEffect(() => {
    const status = document.getElementById("coleman-key-finder-status");
    if (status && status.textContent !== announcement) {
      status.textContent = announcement;
    }
  }, [announcement]);

  return null;
}
