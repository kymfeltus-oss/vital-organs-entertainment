"use client";

import { Send } from "lucide-react";
import {
  POV_MOCK_CHAT_MESSAGES,
  POV_MOCK_CREATOR,
  POV_MOCK_GIFT_ALERT,
  POV_MOCK_GOAL,
  POV_QUICK_GIFTS,
  formatPovCurrency,
} from "@/lib/experience/live-pov-mock";

const ACCENT_CLASS = {
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
    <div className="viewer-pov-desktop flex h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <div className="flex min-w-0 flex-[3] flex-col border-r border-brand-border">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-brand-border px-6 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-headline text-fluid-section uppercase tracking-[0.1em] text-white">
              {POV_MOCK_CREATOR.streamTitle}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-border font-ui text-sm font-bold text-white"
                style={{ background: POV_MOCK_CREATOR.avatarGradient }}
                aria-hidden="true"
              >
                {POV_MOCK_CREATOR.initials}
              </div>
              <div>
                <p className="font-ui text-sm font-semibold text-white">{POV_MOCK_CREATOR.name}</p>
                <p className="font-body text-xs text-brand-muted">{POV_MOCK_CREATOR.handle}</p>
              </div>
              <button
                type="button"
                className="touch-target rounded-full border border-brand-blue/40 bg-brand-blue/10 px-4 py-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-blue transition hover:bg-brand-blue/20"
              >
                Follow
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-panel px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            <span className="font-ui text-xs font-semibold text-white">
              {POV_MOCK_CREATOR.viewerCount.toLocaleString()} watching
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-panel shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/40 via-brand-panel to-brand-blue/30" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(255,255,255,0.1),transparent)]" />
              <p className="absolute inset-0 flex items-center justify-center font-ui text-[0.65rem] font-bold uppercase tracking-[0.35em] text-white/35">
                16:9 HD Stream Placeholder
              </p>
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
                Live
              </span>
            </div>
          </div>

          <section className="glass-panel shrink-0 rounded-xl border border-brand-border p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                  Giving Goal
                </p>
                <p className="mt-1 font-headline text-2xl tracking-wide text-white">
                  {formatPovCurrency(POV_MOCK_GOAL.raised)}
                  <span className="text-brand-muted">
                    {" "}
                    / {formatPovCurrency(POV_MOCK_GOAL.target)} raised
                  </span>
                </p>
              </div>
              <p className="font-ui text-sm font-semibold text-brand-blue">{goalPercent}%</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue via-[#5B42FF] to-brand-pink transition-[width] duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {POV_QUICK_GIFTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="touch-target rounded-lg border border-brand-border bg-black/40 px-4 py-2.5 font-ui text-xs font-bold text-white transition hover:border-brand-blue/50 hover:text-brand-blue"
                >
                  {formatPovCurrency(amount)}
                </button>
              ))}
              <button
                type="button"
                className="touch-target rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-4 py-2.5 font-ui text-xs font-bold text-brand-pink transition hover:bg-brand-pink/20"
              >
                Custom Amount
              </button>
            </div>
          </section>
        </div>
      </div>

      <aside className="flex min-w-0 flex-[1] flex-col bg-brand-panel/50">
        <div className="shrink-0 border-b border-brand-border px-4 py-3">
          <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
            Live Chat
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {POV_MOCK_CHAT_MESSAGES.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-brand-border/80 bg-black/35 px-3 py-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`font-ui text-xs font-bold ${ACCENT_CLASS[entry.accent]}`}>
                    {entry.user}
                  </p>
                  <span className="font-ui text-[0.58rem] text-brand-muted">{entry.timestamp}</span>
                </div>
                <p className="mt-1 font-body text-sm leading-relaxed text-white">
                  {entry.type === "seed" ? (
                    <span className="text-brand-pink">✦ {entry.text}</span>
                  ) : (
                    entry.text
                  )}
                </p>
              </div>
            ))}

            <div className="viewer-pov-gift-alert rounded-lg border border-brand-pink/45 bg-brand-pink/10 px-3 py-2.5 text-center">
              <p className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-brand-pink">
                {POV_MOCK_GIFT_ALERT.name} sowed {formatPovCurrency(POV_MOCK_GIFT_ALERT.amount)}!
              </p>
            </div>
          </div>

          <div className="shrink-0 border-t border-brand-border p-3">
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="viewer-pov-desktop-chat">
                Send a chat message
              </label>
              <input
                id="viewer-pov-desktop-chat"
                type="text"
                readOnly
                placeholder="Say something..."
                className="h-11 min-w-0 flex-1 rounded-lg border border-brand-border bg-black/50 px-3 font-body text-sm text-white placeholder:text-brand-muted"
              />
              <button
                type="button"
                className="touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-blue/40 bg-brand-blue/15 text-brand-blue transition hover:bg-brand-blue/25"
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
