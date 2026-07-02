"use client";

import Link from "next/link";
import { VolumeX, X } from "lucide-react";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

type LiveExperienceHeaderProps = {
  streamTitle: string;
  streamSubtitle?: string;
  statusLabel: string;
  viewerCountLabel: string;
  showAudioUnlock: boolean;
  onEnableAudio: () => void;
};

export default function LiveExperienceHeader({
  streamTitle,
  streamSubtitle = "300 Awakening",
  statusLabel,
  viewerCountLabel,
  showAudioUnlock,
  onEnableAudio,
}: LiveExperienceHeaderProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-4 py-3 pr-[4.75rem] sm:px-6 sm:pr-24 lg:relative lg:px-6 lg:py-4 lg:pr-20">
      <div className="flex items-start justify-between gap-3 bg-transparent backdrop-blur-sm">
        <div className="min-w-0">
          <p className="font-ui text-[0.56rem] font-bold uppercase tracking-[0.24em] text-brand-blue/90 sm:text-[0.6rem]">
            {streamSubtitle}
          </p>
          <h1 className="mt-0.5 truncate font-headline text-base uppercase tracking-[0.06em] text-white sm:text-xl lg:text-2xl">
            {streamTitle}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/80">
              <span
                className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]"
                aria-hidden="true"
              />
              {statusLabel}
            </span>
            <span
              className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/65"
              aria-label={`${viewerCountLabel} watching live`}
            >
              {viewerCountLabel} watching
            </span>
          </div>
        </div>
      </div>

      <div className="absolute right-14 top-3 z-50 flex items-center gap-2 sm:right-16 lg:right-20 lg:top-4">
        {showAudioUnlock ? (
          <button
            type="button"
            onClick={onEnableAudio}
            aria-label="Turn on live stream sound"
            className="touch-target grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/30 text-brand-blue backdrop-blur-md transition hover:bg-black/45"
          >
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <Link
        href={ATTENDEE_DASHBOARD_PATH}
        aria-label="Back to dashboard"
        className="touch-target absolute right-4 top-3 z-50 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40 lg:top-4"
      >
        <X className="h-5 w-5 text-white" aria-hidden="true" />
      </Link>
    </header>
  );
}
