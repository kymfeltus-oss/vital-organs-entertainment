"use client";

import Link from "next/link";
import { Send, X } from "lucide-react";
import {
  POV_MOCK_CHAT_MESSAGES,
  POV_MOCK_CREATOR,
  POV_MOCK_GIFT_ALERT,
  POV_MOCK_GOAL,
  POV_QUICK_GIFTS,
  formatPovCurrency,
  formatPovViewerCount,
} from "@/lib/experience/live-pov-mock";

const NAME_CLASS = {
  blue: "text-brand-blue",
  pink: "text-brand-pink",
  purple: "text-brand-purple",
} as const;

export default function ViewerPovGoLiveDesktop() {
  const goalPercent = Math.min(
    100,
    Math.round((POV_MOCK_GOAL.raised / POV_MOCK_GOAL.target) * 100),
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-brand-black">
      {/* Left — immersive video stage (75%) */}
      <div className="relative min-w-0 flex-[3] overflow-hidden">
        <div
          className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-[#1a0a2e] via-[#221038] to-[#0a1628]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_38%,rgba(255,255,255,0.12),transparent)]" />
        </div>

        {/* Floating header on video */}
        <div className="absolute left-6 right-6 top-6 z-20 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-headline text-fluid-section uppercase tracking-widest text-white viewer-pov-text-shadow">
              {POV_MOCK_CREATOR.streamTitle}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-white/20 font-ui text-sm font-bold text-white"
                style={{ background: POV_MOCK_CREATOR.avatarGradient }}
                aria-hidden="true"
              >
                {POV_MOCK_CREATOR.initials}
              </div>
              <div>
                <p className="font-ui text-sm font-semibold text-white viewer-pov-text-shadow">
                  {POV_MOCK_CREATOR.name}
                </p>
                <p className="font-body text-xs text-white/70 viewer-pov-text-shadow">
                  {POV_MOCK_CREATOR.handle}
                </p>
              </div>
              <button
                type="button"
                className="touch-target rounded-full bg-white/10 px-4 py-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Follow
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 font-ui text-[0.62rem] font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
                Live
              </span>
              <span className="rounded-full bg-black/45 px-3 py-1 font-ui text-xs text-white backdrop-blur-sm viewer-pov-text-shadow">
                👁️ {formatPovViewerCount(POV_MOCK_CREATOR.viewerCount)}
              </span>
            </div>
          </div>

          <Link
            href="/experience"
            className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label="Close live stream"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        {/* Bottom monetization strip — frameless over video */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-6 pb-6 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/60 viewer-pov-text-shadow">
                Giving Goal
              </p>
              <p className="mt-1 font-headline text-2xl text-white viewer-pov-text-shadow">
                {formatPovCurrency(POV_MOCK_GOAL.raised)}
                <span className="text-white/55">
                  {" "}
                  / {formatPovCurrency(POV_MOCK_GOAL.target)}
                </span>
              </p>
            </div>
            <p className="font-ui text-sm font-semibold text-brand-blue viewer-pov-text-shadow">
              {goalPercent}%
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-blue via-[#5B42FF] to-brand-pink"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {POV_QUICK_GIFTS.map((amount) => (
              <button
                key={amount}
                type="button"
                className="touch-target rounded-full bg-white/10 px-4 py-2 font-ui text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {formatPovCurrency(amount)}
              </button>
            ))}
            <button
              type="button"
              className="touch-target rounded-full bg-brand-pink/20 px-4 py-2 font-ui text-xs font-bold text-brand-pink backdrop-blur-md transition hover:bg-brand-pink/30"
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Right — glass chat sidebar (25%) */}
      <aside className="viewer-pov-glass-sidebar flex min-w-0 flex-[1] flex-col border-l border-white/10 bg-black/35 backdrop-blur-2xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {POV_MOCK_CHAT_MESSAGES.map((entry) => (
              <div key={entry.id} className="viewer-pov-glass-msg rounded-xl px-3 py-2">
                <p className={`font-ui text-xs font-bold ${NAME_CLASS[entry.accent]}`}>
                  {entry.user}
                  <span className="ml-2 font-normal text-white/35">{entry.timestamp}</span>
                </p>
                <p className="mt-1 font-body text-sm leading-relaxed text-white/95">
                  {entry.type === "seed" ? (
                    <span className="text-amber-300">✦ {entry.text}</span>
                  ) : (
                    entry.text
                  )}
                </p>
              </div>
            ))}

            <div className="viewer-pov-gift-alert rounded-xl px-3 py-2.5 text-center">
              <p className="font-ui text-xs font-bold uppercase tracking-wider text-brand-pink">
                {POV_MOCK_GIFT_ALERT.name} sowed {formatPovCurrency(POV_MOCK_GIFT_ALERT.amount)}!
              </p>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="viewer-pov-desktop-chat">
                Send a chat message
              </label>
              <input
                id="viewer-pov-desktop-chat"
                type="text"
                readOnly
                placeholder="Join the conversation..."
                className="h-11 min-w-0 flex-1 rounded-full border-0 bg-white/8 px-4 font-body text-sm text-white placeholder:text-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <button
                type="button"
                className="touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue transition hover:bg-brand-blue/30"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
