"use client";

import type { ReactNode } from "react";
import IgLiveDesktop from "@/components/experience/live/ig/IgLiveDesktop";
import IgLiveMobile from "@/components/experience/live/ig/IgLiveMobile";

type IgLiveShellProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  /** Mock layout preview — no stream gate required. */
  preview?: boolean;
};

export default function IgLiveShell({
  showPaywall,
  paywallOverlay,
  preview = false,
}: IgLiveShellProps) {
  return (
    <>
      <IgLiveMobile
        showPaywall={showPaywall}
        paywallOverlay={paywallOverlay}
        preview={preview}
      />
      <IgLiveDesktop
        showPaywall={showPaywall}
        paywallOverlay={paywallOverlay}
        preview={preview}
      />
    </>
  );
}
