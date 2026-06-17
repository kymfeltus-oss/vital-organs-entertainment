"use client";

import type { ReactNode } from "react";
import { IgLiveChatProvider } from "@/components/experience/live/ig/IgLiveChatContext";
import IgLiveDesktop from "@/components/experience/live/ig/IgLiveDesktop";
import IgLiveMobile from "@/components/experience/live/ig/IgLiveMobile";
import { useDesktopLiveLayout } from "@/lib/experience/useDesktopLiveLayout";

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
  const isDesktop = useDesktopLiveLayout();
  const shellProps = { showPaywall, paywallOverlay, preview };

  // Preview: render both surfaces — CSS picks visible layout (SSR-safe, no hydration mismatch).
  if (preview) {
    return (
      <>
        <div className="md:hidden">
          <IgLiveMobile {...shellProps} />
        </div>
        <div className="hidden md:block">
          <IgLiveDesktop {...shellProps} />
        </div>
      </>
    );
  }

  if (isDesktop) {
    return <IgLiveDesktop {...shellProps} />;
  }

  return (
    <IgLiveChatProvider>
      <IgLiveMobile {...shellProps} />
    </IgLiveChatProvider>
  );
}
