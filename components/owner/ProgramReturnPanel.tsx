"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import {
  decodeGraphicsPresetMetadata,
  type OwnerGraphicsPreset,
} from "@/lib/owner/graphics-data-plane";
import type { PublishStatus } from "@/lib/owner/contracts";
import { attachHlsPlayback } from "@/lib/live/attach-hls-playback";

type ProgramReturnPanelProps = {
  livePreset: OwnerGraphicsPreset | null;
  playbackHlsUrl: string | null;
  publishStatus: PublishStatus;
  playbackReachable: boolean;
};

type ProgramReturnViewMode = "fill" | "contain";

const PROGRAM_RETURN_SCREEN_GRADIENT =
  "bg-[radial-gradient(circle_at_50%_18%,rgba(0,168,255,0.24),transparent_24%),radial-gradient(circle_at_78%_76%,rgba(255,47,175,0.18),transparent_30%),linear-gradient(180deg,#10132c_0%,#050710_52%,#010102_100%)]";

function getMediaFitClass(viewMode: ProgramReturnViewMode): string {
  return viewMode === "fill" ? "object-cover" : "object-contain bg-zinc-950";
}

/** Full-bleed media layer — no fixed 16:9 dimensions; fills portrait phone screen only. */
function ProgramReturnMediaLayer({
  children,
  viewMode,
}: {
  children: ReactNode;
  viewMode: ProgramReturnViewMode;
}) {
  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${viewMode === "contain" ? "bg-zinc-950" : ""}`}
    >
      {children}
    </div>
  );
}

function ProgramReturnHlsPreview({
  url,
  viewMode,
}: {
  url: string;
  viewMode: ProgramReturnViewMode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    setError(null);

    void attachHlsPlayback(video, url, {
      onFatalError: (details) => setError(details || "Unable to play live HLS feed."),
    }).then((dispose) => {
      if (cancelled) {
        dispose();
        return;
      }
      cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [url]);

  return (
    <ProgramReturnMediaLayer viewMode={viewMode}>
      <video
        ref={videoRef}
        className={`h-full w-full ${getMediaFitClass(viewMode)}`}
        muted
        playsInline
        autoPlay
        crossOrigin="anonymous"
      />
      {error ? (
        <div className="absolute inset-0 z-[1] grid place-items-center bg-black/85 px-4 text-center font-body text-[0.62rem] leading-snug text-red-300">
          {error}
        </div>
      ) : null}
      <div className="absolute left-2 top-2 z-[1] inline-flex items-center gap-1 rounded-full border border-lime-300/35 bg-black/70 px-2 py-0.5 font-ui text-[0.42rem] font-black uppercase tracking-[0.12em] text-lime-300">
        <Radio className="h-2.5 w-2.5" aria-hidden />
        Live HLS
      </div>
    </ProgramReturnMediaLayer>
  );
}

function MobileLowerThirdOverlay({
  mainText,
  subtitleText,
  logoUrl,
}: {
  mainText: string;
  subtitleText?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-6">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="absolute right-4 top-0 max-h-[14%] max-w-[42%] -translate-y-[calc(100%+0.5rem)] object-contain drop-shadow-[0_0_12px_rgba(0,168,255,0.55)]"
        />
      ) : null}
      <div className="relative w-full overflow-hidden rounded-lg border border-white/14 bg-[linear-gradient(100deg,rgba(1,5,15,0.94),rgba(7,20,42,0.9)_42%,rgba(28,8,30,0.88))] px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#00ddeb,#1677ff,#ff2faf)]" />
        <p className="break-words font-ui text-[0.58rem] font-black uppercase leading-tight tracking-[0.05em] text-white sm:text-[0.62rem]">
          {mainText}
        </p>
        {subtitleText ? (
          <p className="mt-1 break-words font-ui text-[0.46rem] font-black uppercase tracking-[0.12em] text-[#ff4eb7] sm:text-[0.5rem]">
            {subtitleText}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MobileSlateOverlay({
  headerText,
  bodyText,
  logoUrl,
}: {
  headerText: string;
  bodyText?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden px-4 pb-6 pt-4 text-center">
      <div className="w-full rounded-xl border border-white/14 bg-[linear-gradient(135deg,rgba(6,12,26,0.9),rgba(13,21,45,0.82)_48%,rgba(28,8,31,0.86))] px-4 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mx-auto mb-3 max-h-10 max-w-[40%] object-contain" />
        ) : null}
        <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#00ddeb] via-[#1677ff] to-[#ff2faf]" />
        <h3 className="break-words font-headline text-sm font-black uppercase leading-tight tracking-[0.06em] text-white">
          {headerText}
        </h3>
        {bodyText ? (
          <p className="mt-2 break-words font-body text-[0.62rem] leading-snug text-white/78">{bodyText}</p>
        ) : null}
      </div>
    </div>
  );
}

function MobileProgramPlaceholder() {
  return (
    <MobileLowerThirdOverlay mainText="NO LIVE OVERLAY" subtitleText="STAGED IN DECK QUEUE" />
  );
}

function MobilePhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center py-2">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[40px] border-4 border-zinc-800 bg-black p-1 shadow-2xl ring-1 ring-zinc-900">
        <div className="mx-auto mb-1 mt-1.5 h-1 w-14 shrink-0 rounded-full bg-zinc-800" aria-hidden />
        <div
          className={`relative isolate h-[calc(100%-0.75rem)] w-full overflow-hidden rounded-[32px] ${PROGRAM_RETURN_SCREEN_GRADIENT}`}
        >
          <div className="pointer-events-none absolute inset-[3%] z-30 rounded-[24px] border border-white/10" />
          <div className="relative isolate z-10 h-full w-full overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ProgramReturnPanel({
  livePreset,
  playbackHlsUrl,
  publishStatus,
  playbackReachable,
}: ProgramReturnPanelProps) {
  const [viewMode, setViewMode] = useState<ProgramReturnViewMode>("fill");
  const metadata = livePreset ? decodeGraphicsPresetMetadata(livePreset) : null;
  const primary = livePreset?.content_primary?.trim() || "";
  const secondary = metadata?.secondaryText?.trim() || "";
  const isSanctuaryVideo = Boolean(metadata?.builderKind === "SANCTUARY_VIDEO" && metadata.mediaUrl);
  const isSlate = metadata?.builderKind === "SLATE" || metadata?.layoutMode === "fullscreen";
  const hasLiveHls =
    Boolean(playbackHlsUrl) && (publishStatus === "publishing" || playbackReachable);

  let screenContent: ReactNode;

  if (hasLiveHls && playbackHlsUrl) {
    screenContent = (
      <>
        <ProgramReturnHlsPreview url={playbackHlsUrl} viewMode={viewMode} />
        {livePreset && !isSanctuaryVideo && !isSlate ? (
          <MobileLowerThirdOverlay
            mainText={primary || "LIVE GRAPHIC"}
            subtitleText={secondary || null}
            logoUrl={metadata?.imageUrl ?? null}
          />
        ) : null}
      </>
    );
  } else if (isSanctuaryVideo && metadata?.mediaUrl) {
    screenContent = (
      <>
        <ProgramReturnMediaLayer viewMode={viewMode}>
          <video
            src={metadata.mediaUrl}
            className={`h-full w-full ${getMediaFitClass(viewMode)}`}
            autoPlay
            muted
            loop
            playsInline
          />
        </ProgramReturnMediaLayer>
        <div className="absolute left-2 top-2 z-[1] rounded bg-black/70 px-2 py-0.5 font-ui text-[0.42rem] font-black uppercase tracking-[0.1em] text-cyan-100">
          Sanctuary Video
        </div>
      </>
    );
  } else if (livePreset && isSlate) {
    screenContent = (
      <MobileSlateOverlay
        headerText={primary || "PRESENTATION SLATE"}
        bodyText={secondary || null}
        logoUrl={metadata?.imageUrl ?? null}
      />
    );
  } else if (livePreset && primary) {
    screenContent = (
      <>
        <ProgramReturnMediaLayer viewMode={viewMode}>
          <div className={`h-full w-full ${PROGRAM_RETURN_SCREEN_GRADIENT}`} />
        </ProgramReturnMediaLayer>
        <MobileLowerThirdOverlay
          mainText={primary}
          subtitleText={secondary || "STAGED IN DECK QUEUE"}
          logoUrl={metadata?.imageUrl ?? null}
        />
      </>
    );
  } else {
    screenContent = (
      <>
        <ProgramReturnMediaLayer viewMode={viewMode}>
          <div className={`h-full w-full ${PROGRAM_RETURN_SCREEN_GRADIENT}`} />
        </ProgramReturnMediaLayer>
        <MobileProgramPlaceholder />
      </>
    );
  }

  return (
    <div className="pointer-events-none flex min-h-0 flex-col rounded-md border border-white/10 bg-[#050814]/80 p-2 shadow-[0_0_18px_rgba(0,168,255,0.06)]">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0 font-ui text-[0.58rem] font-bold uppercase tracking-[0.08em] text-white/72 sm:text-[0.64rem]">
          LIVE PROGRAM RETURN (PORTRAIT 9:16)
        </div>
        <button
          type="button"
          aria-pressed={viewMode === "contain"}
          aria-label={
            viewMode === "fill"
              ? "Switch program return preview to letterbox mode"
              : "Switch program return preview to crop fill mode"
          }
          onClick={() => setViewMode((mode) => (mode === "fill" ? "contain" : "fill"))}
          className="pointer-events-auto shrink-0 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-ui text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
        >
          {viewMode === "fill" ? "MODE: CROP FILL" : "MODE: LETTERBOX"}
        </button>
      </div>
      <MobilePhoneFrame>
        {/* INSERT INTERACTIVE LIVE CANVAS / HLS MEDIA FRAME STREAM COMPONENT HERE */}
        <div className="relative isolate h-full w-full overflow-hidden">{screenContent}</div>
      </MobilePhoneFrame>
    </div>
  );
}
