"use client";

import { HandHeart } from "lucide-react";

export default function ExperiencePrayerPanel() {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-sm leading-relaxed text-brand-muted">
        Prayer requests open in a dedicated page.
      </p>
      <div className="rounded-xl border border-brand-border bg-black/40 p-4">
        <HandHeart className="h-7 w-7 text-brand-pink" strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white">
          Prayer Wall — Coming Soon
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-brand-muted">
          Full prayer request intake is not live yet. Share encouragement in Fellowship Chat while
          you watch — our team is preparing the prayer wall for this experience.
        </p>
      </div>
      <button
        type="button"
        disabled
        className="touch-target inline-flex min-h-11 cursor-not-allowed items-center justify-center self-start rounded-full border border-brand-border bg-black/30 px-6 py-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-muted opacity-70"
      >
        Submit Prayer Request
      </button>
    </div>
  );
}
