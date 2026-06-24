"use client";

import { VideoOff } from "lucide-react";
import LiveHubPreviewPlayer from "@/components/live-hub/LiveHubPreviewPlayer";

type CountdownPreviewPlayerProps = {
  playbackUrl: string | null;
  className?: string;
};

export default function CountdownPreviewPlayer({
  playbackUrl,
  className = "",
}: CountdownPreviewPlayerProps) {
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden border border-brand-border bg-black ${className}`}
    >
      {playbackUrl ? (
        <LiveHubPreviewPlayer playbackUrl={playbackUrl} />
      ) : (
        <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-brand-muted">
          <VideoOff className="h-8 w-8" aria-hidden="true" />
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em]">
            No preview signal available
          </p>
        </div>
      )}
    </div>
  );
}
