"use client";

import { useMemo } from "react";
import { Radio, Video, VideoOff } from "lucide-react";
import LiveHubPreviewPlayer from "@/components/live-hub/LiveHubPreviewPlayer";
import type { UsePreShowSetupReturn } from "@/hooks/production/usePreShowSetup";
import { isValidHlsUrl } from "@/lib/live/hls";
import { resolveActiveOpsPreviewHlsUrl } from "@/lib/ops/resolve-active-stream-playback";
import { cn } from "@/lib/utils";

type PreShowPreviewMonitorsProps = {
  setup: UsePreShowSetupReturn;
};

export default function PreShowPreviewMonitors({ setup }: PreShowPreviewMonitorsProps) {
  const { setupState, stream, currentStep, heroPreview } = setup;

  const playbackUrl = useMemo(() => {
    const wizardUrl = setupState.hlsPreviewUrl.trim();
    if (isValidHlsUrl(wizardUrl)) return wizardUrl;
    return resolveActiveOpsPreviewHlsUrl(stream);
  }, [setupState.hlsPreviewUrl, stream]);

  const isLive = stream?.isLive === true;
  const titleActive = currentStep.id === "eventTitle";
  const displayTitle =
    setupState.eventTitle.trim() || heroPreview.headline.trim() || "Enter show title…";
  const displayEyebrow = heroPreview.eyebrow.trim() || "LIVE RECORDING EXPERIENCE";
  const displaySubtitle = heroPreview.subtitle.trim() || "THE AWAKENING BEGINS SOON";

  return (
    <section
      aria-label="Production preview monitors"
      className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]"
    >
      <article className="overflow-hidden rounded-xl border border-brand-border bg-brand-panel/30">
        <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            Live Feed
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em]",
              isLive
                ? "border-brand-pink/40 bg-brand-pink/15 text-brand-pink"
                : playbackUrl
                  ? "border-brand-blue/30 bg-brand-blue/10 text-brand-blue"
                  : "border-brand-border text-brand-muted",
            )}
          >
            <Radio className="h-3 w-3" aria-hidden="true" />
            {isLive ? "Live" : playbackUrl ? "Preview" : "No Signal"}
          </span>
        </div>

        <div className="relative aspect-video w-full bg-brand-black">
          {playbackUrl ? (
            <LiveHubPreviewPlayer playbackUrl={playbackUrl} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <VideoOff className="h-8 w-8 text-brand-muted/70" aria-hidden="true" />
              <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                No preview URL yet
              </p>
              <p className="font-body text-xs text-brand-muted">
                Add an HLS preview URL in the wizard to monitor the live feed here.
              </p>
            </div>
          )}
        </div>
      </article>

      <article
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border bg-brand-panel/30 transition",
          titleActive
            ? "border-brand-purple/50 shadow-[0_0_24px_rgba(138,46,255,0.25)]"
            : "border-brand-border",
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            Title Preview
          </p>
          {titleActive ? (
            <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-brand-purple">
              Live
            </span>
          ) : null}
        </div>

        <div className="relative flex flex-1 flex-col bg-brand-black p-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,168,255,0.12),transparent_55%)]" />

          <div className="relative flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-lg border border-brand-border bg-brand-black/90">
            <div className="border-b border-brand-border bg-brand-black/70 px-2 py-1.5 text-center">
              <p className="font-ui text-[0.42rem] font-bold uppercase tracking-[0.18em] text-brand-blue">
                {displayEyebrow}
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-center">
              <h3
                className={cn(
                  "font-headline uppercase leading-tight tracking-[0.08em] text-white transition",
                  titleActive
                    ? "text-[clamp(0.72rem,2.8vw,0.95rem)] text-brand-gradient"
                    : "text-[clamp(0.68rem,2.5vw,0.88rem)]",
                )}
              >
                {displayTitle}
              </h3>
              <p className="font-body text-[0.48rem] uppercase tracking-[0.12em] text-brand-muted">
                {displaySubtitle}
              </p>
              <span className="mt-1 inline-flex rounded-full border border-brand-border px-2 py-0.5 font-ui text-[0.4rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                Waiting for live signal
              </span>
            </div>
          </div>

          <p className="relative mt-2 flex items-center gap-1.5 font-body text-[0.62rem] text-brand-muted">
            <Video className="h-3 w-3 shrink-0" aria-hidden="true" />
            Updates as you type the show title
          </p>
        </div>
      </article>
    </section>
  );
}
