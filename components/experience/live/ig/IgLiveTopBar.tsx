"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { IG_LIVE_CREATOR } from "@/lib/experience/ig-live-config";
import { useIgLiveViewerCount } from "@/lib/experience/useIgLiveViewerCount";

type IgLiveTopBarProps = {
  isLive: boolean;
};

export default function IgLiveTopBar({ isLive }: IgLiveTopBarProps) {
  const viewerLabel = useIgLiveViewerCount(isLive);

  return (
    <header className="ig-live-top-bar pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start gap-3 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Link
        href={IG_LIVE_CREATOR.exitHref}
        className="touch-target pointer-events-auto mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/55"
        aria-label="Exit live"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </Link>

      <div className="pointer-events-auto mt-2 flex min-w-0 flex-1 items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-pink/80 ring-offset-2 ring-offset-black/40">
          <Image
            src={IG_LIVE_CREATOR.avatarSrc}
            alt=""
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-headline text-base uppercase tracking-[0.14em] text-white ig-live-text-shadow md:text-lg">
            {IG_LIVE_CREATOR.name}
          </p>
          <p className="truncate font-body text-xs text-brand-muted ig-live-text-shadow md:text-sm">
            {IG_LIVE_CREATOR.subtitle}
          </p>
          <p className="mt-0.5 flex items-center gap-2 font-ui text-[0.58rem] font-semibold uppercase tracking-[0.12em] ig-live-text-shadow">
            {isLive ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-brand-pink">
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-pink"
                    aria-hidden="true"
                  />
                  Live
                </span>
                <span className="text-white/60">·</span>
                <span className="text-white/75">{viewerLabel} watching</span>
              </>
            ) : (
              <span className="text-brand-blue">Waiting for live signal</span>
            )}
          </p>
        </div>
      </div>
    </header>
  );
}
