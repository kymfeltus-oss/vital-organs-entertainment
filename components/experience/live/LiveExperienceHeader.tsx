"use client";

import Link from "next/link";
import { Eye, VolumeX, X } from "lucide-react";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

type LiveExperienceHeaderProps = {
  streamTitle: string;
  streamSubtitle?: string;
  viewerCountLabel: string;
  showAudioUnlock: boolean;
  onEnableAudio: () => void;
};

export default function LiveExperienceHeader({
  streamTitle,
  streamSubtitle = "The Awakening",
  viewerCountLabel,
  showAudioUnlock,
  onEnableAudio,
}: LiveExperienceHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-50 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto bg-gradient-to-b from-black/70 via-black/35 to-transparent px-4 pb-4 pt-1 pr-[4.75rem] sm:px-6 sm:pr-24 lg:relative lg:bg-transparent lg:from-transparent lg:via-transparent lg:to-transparent lg:px-6 lg:py-4 lg:pr-20">
        <div className="min-w-0">
          <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-blue drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] sm:text-[0.68rem]">
            {streamSubtitle}
          </p>
          <h1 className="mt-0.5 truncate font-headline text-lg uppercase tracking-[0.06em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:text-xl lg:text-2xl">
            {streamTitle}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/35 bg-black/35 px-2.5 py-1 font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-blue backdrop-blur-sm"
              aria-label={`${viewerCountLabel} watching live`}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {viewerCountLabel} watching
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-14 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex items-center gap-2 sm:right-16 lg:right-20 lg:top-4">
        {showAudioUnlock ? (
          <button
            type="button"
            onClick={onEnableAudio}
            aria-label="Turn on live stream sound"
            className="touch-target grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-brand-blue shadow-[0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-md transition hover:bg-black/60"
          >
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <Link
        href={ATTENDEE_DASHBOARD_PATH}
        aria-label="Back to dashboard"
        className="touch-target pointer-events-auto absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-[0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-md transition hover:bg-black/60 lg:top-4"
      >
        <X className="h-5 w-5 text-white" aria-hidden="true" />
      </Link>
    </header>
  );
}
