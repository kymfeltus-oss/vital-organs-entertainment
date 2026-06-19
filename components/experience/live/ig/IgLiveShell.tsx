"use client";

import { IgLiveChatProvider } from "@/components/experience/live/ig/IgLiveChatContext";
import type { IgLiveShellProps } from "@/components/experience/live/ig/ig-live-shell-types";
import IgLiveMobile from "@/components/experience/live/ig/IgLiveMobile";

export default function IgLiveShell(props: IgLiveShellProps) {
  return (
    <IgLiveChatProvider>
      <IgLiveMobile {...props} />
    </IgLiveChatProvider>
  );
}
