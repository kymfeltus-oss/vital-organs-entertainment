"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { attachHlsPlayback } from "@/lib/live/attach-hls-playback";

type FeedRuntimeStatus = "waiting" | "active" | "degraded";
type PortraitViewMode = "fill" | "contain";

const PHONE_SCREEN_GRADIENT =
  "bg-[radial-gradient(circle_at_50%_18%,rgba(0,168,255,0.24),transparent_24%),radial-gradient(circle_at_78%_76%,rgba(255,47,175,0.18),transparent_30%),linear-gradient(180deg,#10132c_0%,#050710_52%,#010102_100%)]";

function getMediaFitClass(viewMode: PortraitViewMode): string {
  return viewMode === "fill" ? "object-cover" : "object-contain bg-zinc-950";
}

function feedStatusLabel(status: FeedRuntimeStatus): string {
  if (status === "active") return "FEED ACTIVE";
  if (status === "degraded") return "DEGRADED / STALLED";
  return "WAITING FOR SIGNAL";
}

function feedStatusTone(status: FeedRuntimeStatus): string {
  if (status === "active") return "border-lime-300/35 bg-lime-300/10 text-lime-300";
  if (status === "degraded") return "border-amber-300/35 bg-amber-300/10 text-amber-300";
  return "border-white/10 bg-white/5 text-white/55";
}

function FeedStatusBadge({ status }: { status: FeedRuntimeStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.1em] ${feedStatusTone(status)}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active" ? "bg-lime-300" : status === "degraded" ? "bg-amber-300" : "bg-white/35"
        }`}
      />
      {feedStatusLabel(status)}
    </span>
  );
}

function TechCheckPhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center py-2">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[40px] border-4 border-zinc-800 bg-black p-1 shadow-2xl ring-1 ring-zinc-900">
        <div className="mx-auto mb-1 mt-1.5 h-1 w-14 shrink-0 rounded-full bg-zinc-800" aria-hidden />
        <div
          className={`relative isolate h-[calc(100%-0.75rem)] w-full overflow-hidden rounded-[32px] ${PHONE_SCREEN_GRADIENT}`}
        >
          <div className="pointer-events-none absolute inset-[3%] z-30 rounded-[24px] border border-white/10" />
          <div className="relative isolate z-10 h-full w-full overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}

function TechCheckHlsPlayer({
  url,
  layout,
  viewMode = "fill",
  onStatusChange,
}: {
  url: string;
  layout: "landscape" | "portrait";
  viewMode?: PortraitViewMode;
  onStatusChange: (status: FeedRuntimeStatus) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const reportStatus = useCallback(
    (status: FeedRuntimeStatus) => {
      onStatusChange(status);
    },
    [onStatusChange],
  );

  useEffect(() => {
    if (!url) {
      reportStatus("waiting");
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    setPlaybackError(null);
    reportStatus("waiting");

    const onLoadStart = () => reportStatus("waiting");
    const onPlaying = () => reportStatus("active");
    const onWaiting = () => reportStatus("degraded");
    const onStalled = () => reportStatus("degraded");
    const onEmptied = () => reportStatus("waiting");

    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("emptied", onEmptied);

    void attachHlsPlayback(video, url, {
      onManifestParsed: () => reportStatus("waiting"),
      onFatalError: (details) => {
        setPlaybackError(details || "Unable to play test HLS feed.");
        reportStatus("degraded");
      },
    }).then((dispose) => {
      if (cancelled) {
        dispose();
        return;
      }
      cleanup = dispose;
    });

    return () => {
      cancelled = true;
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("emptied", onEmptied);
      cleanup?.();
    };
  }, [reportStatus, url]);

  const videoClass =
    layout === "landscape"
      ? "absolute inset-0 h-full w-full bg-black object-contain"
      : `h-full w-full ${getMediaFitClass(viewMode)}`;

  const videoNode = (
    <>
      <video
        ref={videoRef}
        className={videoClass}
        muted
        playsInline
        autoPlay
        crossOrigin="anonymous"
      />
      {playbackError ? (
        <div className="absolute inset-0 z-[1] grid place-items-center bg-black/85 px-4 text-center font-body text-[0.68rem] leading-snug text-red-300">
          {playbackError}
        </div>
      ) : null}
      {!url ? (
        <div className="absolute inset-0 z-[1] grid place-items-center bg-black/80 px-4 text-center font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white/45">
          Enter a test .m3u8 URL and load feed
        </div>
      ) : null}
    </>
  );

  if (layout === "portrait") {
    return (
      <div className={`absolute inset-0 z-0 overflow-hidden ${viewMode === "contain" ? "bg-zinc-950" : ""}`}>
        {videoNode}
      </div>
    );
  }

  return <div className="relative aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-black">{videoNode}</div>;
}

export default function OwnerTechCheckClient() {
  const [streamLabel, setStreamLabel] = useState("Canon XA60 Test");
  const [testUrlInput, setTestUrlInput] = useState("");
  const [activeTestUrl, setActiveTestUrl] = useState("");
  const [portraitViewMode, setPortraitViewMode] = useState<PortraitViewMode>("fill");
  const [landscapeStatus, setLandscapeStatus] = useState<FeedRuntimeStatus>("waiting");
  const [portraitStatus, setPortraitStatus] = useState<FeedRuntimeStatus>("waiting");

  const handleLoadFeed = () => {
    setActiveTestUrl(testUrlInput.trim());
    setLandscapeStatus("waiting");
    setPortraitStatus("waiting");
  };

  return (
    <main className="min-h-dvh bg-[#020203] text-white">
      <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-4 px-4 py-6 sm:px-6">
        <header className="rounded-md border border-white/10 bg-[#050814]/90 px-4 py-3">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#00a8ff]">
            Owner Tools
          </p>
          <h1 className="mt-1 font-headline text-xl uppercase tracking-[0.06em] sm:text-2xl">
            Cameraman Tech Check Sandbox
          </h1>
          <p className="mt-2 max-w-3xl font-body text-sm text-white/60">
            Isolated local preview — test URLs stay in this browser session and never write to production
            Supabase stream keys or live database tables.
          </p>
        </header>

        <section className="rounded-md border border-white/10 bg-[#050814]/80 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-1 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/65">
                Stream Label
              </span>
              <input
                type="text"
                value={streamLabel}
                onChange={(event) => setStreamLabel(event.target.value)}
                placeholder="Canon XA60 Test"
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-body text-sm text-white outline-none ring-[#00a8ff]/40 focus:border-[#00a8ff]/50 focus:ring-1"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/65">
                Test HLS Playback URL (.m3u8)
              </span>
              <input
                type="url"
                value={testUrlInput}
                onChange={(event) => setTestUrlInput(event.target.value)}
                placeholder="https://…/playlist.m3u8"
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-body text-sm text-white outline-none ring-[#00a8ff]/40 focus:border-[#00a8ff]/50 focus:ring-1"
              />
            </label>
            <button
              type="button"
              onClick={handleLoadFeed}
              className="min-h-10 rounded border border-[#00a8ff]/40 bg-[#00a8ff]/10 px-4 font-ui text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#00a8ff] transition hover:bg-[#00a8ff]/20"
            >
              Load Feed
            </button>
          </div>
          {activeTestUrl ? (
            <p className="mt-3 truncate font-body text-xs text-white/45">
              Active test source: <span className="text-white/70">{activeTestUrl}</span>
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-md border border-white/10 bg-[#050814]/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-ui text-[0.64rem] font-bold uppercase tracking-[0.1em] text-white/75">
                  Landscape Monitor (16:9)
                </h2>
                <p className="mt-0.5 font-body text-xs text-white/45">{streamLabel || "Untitled feed"}</p>
              </div>
              <FeedStatusBadge status={landscapeStatus} />
            </div>
            <TechCheckHlsPlayer
              url={activeTestUrl}
              layout="landscape"
              onStatusChange={setLandscapeStatus}
            />
          </section>

          <section className="rounded-md border border-white/10 bg-[#050814]/80 p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-ui text-[0.64rem] font-bold uppercase tracking-[0.1em] text-white/75">
                  Portrait Program Return (9:16)
                </h2>
                <p className="mt-0.5 font-body text-xs text-white/45">{streamLabel || "Untitled feed"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FeedStatusBadge status={portraitStatus} />
                <button
                  type="button"
                  aria-pressed={portraitViewMode === "contain"}
                  aria-label={
                    portraitViewMode === "fill"
                      ? "Switch portrait preview to letterbox mode"
                      : "Switch portrait preview to crop fill mode"
                  }
                  onClick={() =>
                    setPortraitViewMode((mode) => (mode === "fill" ? "contain" : "fill"))
                  }
                  className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-ui text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
                >
                  {portraitViewMode === "fill" ? "MODE: CROP FILL" : "MODE: LETTERBOX"}
                </button>
              </div>
            </div>
            <TechCheckPhoneFrame>
              <TechCheckHlsPlayer
                url={activeTestUrl}
                layout="portrait"
                viewMode={portraitViewMode}
                onStatusChange={setPortraitStatus}
              />
            </TechCheckPhoneFrame>
          </section>
        </div>
      </div>
    </main>
  );
}
