"use client";

import Link from "next/link";
import { Gift, Sprout, X } from "lucide-react";
import {
  POV_MOCK_CHAT_MESSAGES,
  POV_MOCK_CREATOR,
  formatPovCurrency,
} from "@/lib/experience/live-pov-mock";

const ACCENT_CLASS = {
  blue: "text-brand-blue",
  pink: "text-brand-pink",
  purple: "text-brand-purple",
} as const;

export default function ViewerPovGoLiveMobile() {
  return (
    <div className="viewer-pov-mobile relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/55 via-brand-pink/30 to-brand-blue/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_32%,rgba(255,255,255,0.14),transparent_68%)]" />
        <div className="absolute bottom-[16%] left-1/2 h-[44%] w-[70%] -translate-x-1/2 rounded-[3rem] bg-gradient-to-t from-black/30 via-white/10 to-transparent" />
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.35em] text-white/30">
          Live Camera Feed
        </p>
      </div>

      <header className="viewer-pov-scrim-top absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pb-10 pt-safe">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 font-ui text-xs font-bold text-white shadow-lg backdrop-blur-md"
            style={{ background: POV_MOCK_CREATOR.avatarGradient }}
            aria-hidden="true"
          >
            {POV_MOCK_CREATOR.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-ui text-sm font-semibold text-white viewer-pov-text-shadow">
              {POV_MOCK_CREATOR.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_14px_rgba(220,38,38,0.5)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
                Live
              </span>
              <span className="rounded-full border border-white/15 bg-black/50 px-2 py-0.5 font-ui text-[0.58rem] font-semibold text-white backdrop-blur-md viewer-pov-text-shadow">
                {POV_MOCK_CREATOR.viewerCount.toLocaleString()} watching
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/experience"
          className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75"
          aria-label="Close live stream"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      <div className="viewer-pov-chat-mask pointer-events-none absolute bottom-[5.75rem] left-3 z-10 flex max-h-[40dvh] w-[min(80vw,19rem)] flex-col justify-end gap-2 overflow-hidden pb-1">
        <div className="viewer-pov-chat-scroll flex flex-col justify-end gap-2">
          {POV_MOCK_CHAT_MESSAGES.map((entry) => (
            <div
              key={entry.id}
              className="viewer-pov-chat-bubble rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className={`font-ui text-[0.62rem] font-bold viewer-pov-text-shadow ${ACCENT_CLASS[entry.accent]}`}>
                  {entry.user}
                </p>
                <span className="shrink-0 font-ui text-[0.5rem] text-white/50">{entry.timestamp}</span>
              </div>
              <p className="mt-0.5 font-body text-sm leading-snug text-white viewer-pov-text-shadow">
                {entry.type === "seed" ? (
                  <>
                    <span className="text-brand-pink">✦ </span>
                    {entry.text}
                  </>
                ) : (
                  entry.text
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <footer className="viewer-pov-scrim-bottom absolute inset-x-0 bottom-0 z-20 px-3 pb-safe pt-12">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="viewer-pov-mobile-comment">
            Type a comment
          </label>
          <input
            id="viewer-pov-mobile-comment"
            type="text"
            readOnly
            placeholder="Type a comment..."
            className="h-11 min-w-0 flex-1 rounded-full border border-white/12 bg-black/55 px-4 font-body text-sm text-white placeholder:text-white/45 backdrop-blur-md"
          />
          <button
            type="button"
            className="viewer-pov-seed-pulse touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-pink/50 bg-brand-pink/15 text-brand-pink"
            aria-label="Seed and support"
          >
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-blue/50 bg-brand-blue/15 text-brand-blue"
            aria-label={`Quick gift ${formatPovCurrency(25)}`}
          >
            <Gift className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
