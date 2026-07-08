"use client";

import { useState } from "react";

import KeyFinderLiveAnnouncer from "@/app/enterprise/coleman/components/home/KeyFinderLiveAnnouncer";
import BottomNav from "@/app/enterprise/coleman/components/home/ui/BottomNav";
import HomeHeader from "@/app/enterprise/coleman/components/home/ui/HomeHeader";
import IntelligenceCard from "@/app/enterprise/coleman/components/home/ui/IntelligenceCard";
import KeyOrb from "@/app/enterprise/coleman/components/home/ui/KeyOrb";
import { formatKeyDisplay } from "@/app/enterprise/coleman/lib/live-display";
import { useLiveColemanState } from "@/app/enterprise/coleman/lib/useLiveColemanState";

export default function ColemanHomePage() {
  const {
    liveData,
    rawLiveData,
    sessionTonic,
    micError,
    dismissMicError,
    isLiveEngaged,
    noteSpelling,
    selectSpelling,
  } = useLiveColemanState({ audioEnabled: true });
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const bannerMessage = micError ?? playbackError;

  const detectedKey = rawLiveData.currentKey;
  const showStandbyArtboard = !isLiveEngaged && !detectedKey;

  const { keyLabel, qualityLabel, badgeLabel } = formatKeyDisplay(
    detectedKey ?? (showStandbyArtboard ? liveData.currentKey : null),
    isLiveEngaged ? sessionTonic : detectedKey,
    rawLiveData.currentCents,
    showStandbyArtboard,
    noteSpelling,
  );

  return (
    <div className="coleman-premium-home coleman-reference-home relative flex h-full min-h-0 w-full flex-col overflow-hidden font-[family-name:var(--coleman-font,'Avenir_Next',ui-sans-serif,system-ui)]">
      <KeyFinderLiveAnnouncer currentKey={keyLabel} keyQuality={qualityLabel} />
      <div className="coleman-premium-bg" aria-hidden="true">
        <div className="coleman-premium-wave coleman-premium-wave--1" />
        <div className="coleman-premium-wave coleman-premium-wave--2" />
        <div className="coleman-premium-wave coleman-premium-wave--3" />
        <div className="coleman-premium-wave coleman-premium-wave--4" />
        <div className="coleman-premium-wave coleman-premium-wave--5" />
        <svg
          className="coleman-silk-field"
          viewBox="0 0 430 600"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="coleman-silk-left" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9f8068" stopOpacity="0.62" />
              <stop offset="0.38" stopColor="#d9c6b4" stopOpacity="0.7" />
              <stop offset="0.72" stopColor="#f7eee6" stopOpacity="0.88" />
              <stop offset="1" stopColor="#c8ab91" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="coleman-silk-right" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b5967f" stopOpacity="0.54" />
              <stop offset="0.4" stopColor="#e5d4c4" stopOpacity="0.78" />
              <stop offset="0.76" stopColor="#fff9f2" stopOpacity="0.9" />
              <stop offset="1" stopColor="#c3a68e" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="coleman-silk-light" x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#fffaf4" stopOpacity="0.96" />
              <stop offset="0.48" stopColor="#ead9ca" stopOpacity="0.7" />
              <stop offset="1" stopColor="#af8d73" stopOpacity="0.18" />
            </linearGradient>
            <filter id="coleman-silk-soft" x="-10%" y="-20%" width="120%" height="150%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </defs>
          <path d="M-28 322 C72 345 126 403 228 446 C127 430 48 389 -28 365 Z" fill="url(#coleman-silk-left)" />
          <path d="M-32 364 C72 391 139 431 244 457 C137 454 49 426 -32 397 Z" fill="url(#coleman-silk-light)" />
          <path d="M-38 404 C70 424 147 456 258 466 C148 478 55 463 -38 438 Z" fill="url(#coleman-silk-left)" opacity="0.6" />
          <path d="M458 306 C365 338 318 402 205 447 C298 423 370 370 458 349 Z" fill="url(#coleman-silk-right)" />
          <path d="M462 354 C365 385 304 430 196 458 C303 451 384 417 462 389 Z" fill="url(#coleman-silk-light)" />
          <path d="M468 397 C360 424 286 455 178 468 C288 477 382 457 468 432 Z" fill="url(#coleman-silk-right)" opacity="0.56" />
          <path d="M-18 389 C91 431 146 456 217 463 C291 457 343 421 449 377" fill="none" stroke="#fffaf5" strokeOpacity="0.8" strokeWidth="4" filter="url(#coleman-silk-soft)" />
        </svg>
        <div className="coleman-premium-vignette" />
      </div>

      <HomeHeader />

      <div className="coleman-home-content relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-[92px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bannerMessage ? (
          <div
            className="coleman-home-alert coleman-glass-panel mb-3 flex items-start justify-between gap-2 rounded-2xl px-3 py-2.5 text-[13px] text-[var(--cp-espresso)]"
            role="alert"
          >
            <span>{bannerMessage}</span>
            <button
              type="button"
              className="text-[11px] tracking-[0.1em] text-[var(--cp-muted)]"
              onClick={() => {
                dismissMicError();
                setPlaybackError(null);
              }}
            >
              DISMISS
            </button>
          </div>
        ) : null}

        <KeyOrb
          currentKey={keyLabel}
          keyQuality={qualityLabel}
          keyBadge={badgeLabel}
          isMicActive={rawLiveData.isMicActive}
          noteSpelling={noteSpelling}
          onSelectSpelling={selectSpelling}
        />

        <IntelligenceCard
          currentKey={keyLabel}
          keyQuality={qualityLabel}
          intelligence={liveData.intelligence}
          isLiveEngaged={isLiveEngaged}
        />
      </div>

      <BottomNav onPlaybackError={setPlaybackError} />
    </div>
  );
}
