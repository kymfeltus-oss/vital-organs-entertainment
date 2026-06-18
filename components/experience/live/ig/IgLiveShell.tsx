"use client";

import { IgLiveChatProvider } from "@/components/experience/live/ig/IgLiveChatContext";
import IgLiveDesktop from "@/components/experience/live/ig/IgLiveDesktop";
import type { IgLiveShellProps } from "@/components/experience/live/ig/ig-live-shell-types";
import IgLiveMobile from "@/components/experience/live/ig/IgLiveMobile";
import { useDesktopLiveLayout } from "@/lib/experience/useDesktopLiveLayout";

export default function IgLiveShell(props: IgLiveShellProps) {
  const isDesktop = useDesktopLiveLayout();

  if (isDesktop) {
    return <IgLiveDesktop {...props} />;
  }

  return (
    <IgLiveChatProvider>
      <IgLiveMobile {...props} />
    </IgLiveChatProvider>
  );
}
