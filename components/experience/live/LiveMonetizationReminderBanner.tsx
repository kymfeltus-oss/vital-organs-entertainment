"use client";

import { Sparkles, X } from "lucide-react";
import type { ActiveMonetizationReminder } from "@/lib/owner/graphics-monetization-reminders";
import type { MonetizationReminderCtaKind } from "@/lib/owner/graphics-monetization-reminders";

type LiveMonetizationReminderBannerProps = {
  reminder: ActiveMonetizationReminder;
  onDismiss: () => void;
  onCta: (ctaKind: MonetizationReminderCtaKind) => void;
};

/** Non-blocking live monetization reminder — scheduled from Owner Graphics. */
export default function LiveMonetizationReminderBanner({
  reminder,
  onDismiss,
  onCta,
}: LiveMonetizationReminderBannerProps) {
  const { message } = reminder;

  return (
    <aside
      className="pointer-events-auto absolute inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[45] max-w-md rounded-2xl border border-brand-pink/35 bg-black/78 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:inset-x-4 lg:top-4 lg:right-4 lg:left-auto"
      role="status"
      aria-live="polite"
      aria-label={`${message.headline}. ${message.body}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-pink/35 bg-brand-pink/10 text-brand-pink">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-pink">
            {message.headline}
          </p>
          <p className="mt-1 font-body text-sm leading-snug text-white/90">{message.body}</p>
          <button
            type="button"
            onClick={() => onCta(message.ctaKind)}
            className="touch-target mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/15 px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-blue"
          >
            {message.ctaLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="touch-target inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:text-white"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
