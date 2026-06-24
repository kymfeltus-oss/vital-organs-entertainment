"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

type ExperienceLiveOutroShellProps = {
  config: EventCountdownConfig;
};

export default function ExperienceLiveOutroShell({
  config,
}: ExperienceLiveOutroShellProps) {
  return (
    <main className="live-outro-shell flex min-h-dvh w-full flex-col items-center justify-center bg-brand-black px-6 py-12 pt-safe pb-safe text-center text-white">
      <div className="auth-login-page__glow pointer-events-none" aria-hidden="true" />

      <div className="relative z-[1] w-full max-w-md">
        <div className="relative mx-auto aspect-[3/2] w-full max-w-sm">
          <Image
            src={EXPERIENCE_BRAND_ASSETS.lockup}
            alt="300 Awakening"
            fill
            priority
            sizes="min(100vw, 24rem)"
            className="object-contain object-center"
          />
        </div>

        <p className="mt-8 font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-purple">
          {config.outro_status_label || "EVENT COMPLETE"}
        </p>
        <h1 className="mt-4 font-headline text-[clamp(1.5rem,6vw,2.25rem)] uppercase leading-tight tracking-[0.1em]">
          {config.outro_headline || "THANK YOU FOR JOINING"}
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-body text-sm leading-relaxed text-brand-muted">
          {config.outro_subtitle || "Stay connected for the next gathering."}
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href={ATTENDEE_DASHBOARD_PATH}
            className="touch-target inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-blue/45 bg-brand-blue/12 px-6 font-ui text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-blue transition hover:bg-brand-blue/20"
          >
            Back to Dashboard
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/giving"
            className="touch-target inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-6 font-ui text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-pink transition hover:bg-brand-pink/20"
          >
            Continue Giving
          </Link>
        </div>
      </div>
    </main>
  );
}
