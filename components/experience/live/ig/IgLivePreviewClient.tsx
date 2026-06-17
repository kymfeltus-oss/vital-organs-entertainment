"use client";

import IgLiveShell from "@/components/experience/live/ig/IgLiveShell";
import { LiveExperienceStreamProvider } from "@/lib/experience/LiveExperienceStreamContext";
import { LiveStreamReactionsProvider } from "@/lib/experience/LiveStreamReactionsContext";
import { BroadcastHealthProvider } from "@/lib/parable/BroadcastHealthContext";

export default function IgLivePreviewClient() {
  return (
    <BroadcastHealthProvider surface="experience">
      <LiveStreamReactionsProvider enabled>
        <LiveExperienceStreamProvider enabled={false}>
          <IgLiveShell preview showPaywall={false} />
        </LiveExperienceStreamProvider>
      </LiveStreamReactionsProvider>
    </BroadcastHealthProvider>
  );
}
