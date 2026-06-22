"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Users } from "lucide-react";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";

type EmailGatePersonaPlateProps = {
  attendeeHref: string;
  teamHref: string;
  onAttendeeSelect: () => void;
};

export default function EmailGatePersonaPlate({
  attendeeHref,
  teamHref,
  onAttendeeSelect,
}: EmailGatePersonaPlateProps) {
  return (
    <div className="auth-login-page flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-4 py-8 pt-safe pb-safe sm:px-6 sm:py-12">
      <div className="auth-login-page__glow pointer-events-none" aria-hidden="true" />

      <div className="relative z-[1] w-full max-w-[26rem]">
        <header className="mb-8 text-center">
          <div className="relative mx-auto aspect-[3/2] w-full max-w-[20rem] sm:max-w-[26rem]">
            <Image
              src={EXPERIENCE_BRAND_ASSETS.lockup}
              alt="300 Awakening"
              fill
              priority
              sizes="(max-width: 640px) 72vw, 304px"
              className="object-contain"
            />
          </div>
          <p className="auth-login-page__eyebrow mt-6 font-ui text-[0.58rem] font-bold uppercase tracking-[0.24em]">
            Live · Empower · Transform
          </p>
          <h1 className="mt-3 font-headline text-[clamp(1.75rem,7vw,2.5rem)] uppercase leading-none tracking-[0.1em] text-white">
            Choose Your Path
          </h1>
          <p className="mx-auto mt-3 max-w-[18rem] font-body text-sm leading-relaxed text-brand-muted">
            Select how you&apos;re joining the 300 Awakening experience.
          </p>
        </header>

        <div className="glass-panel rounded-[1.25rem] border border-brand-border p-5 shadow-[0_0_40px_rgba(0,168,255,0.06)] sm:p-7">
          <nav aria-label="Entry path selection" className="space-y-3">
            <Link
              href={attendeeHref}
              onClick={onAttendeeSelect}
              className="touch-target group flex min-h-[4.5rem] w-full items-center justify-between gap-4 rounded-xl border border-brand-blue/45 bg-brand-blue/12 px-5 py-4 transition hover:bg-brand-blue/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <span className="flex min-w-0 items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-blue/35 bg-brand-blue/10 text-brand-blue">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white">
                    Attendee
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-brand-muted">
                    Log in or create account
                  </span>
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-brand-blue transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <div className="auth-login-page__divider my-5">
              <span>Or</span>
            </div>

            <Link
              href={teamHref}
              className="touch-target group flex min-h-[4.5rem] w-full items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-black/40 px-5 py-4 transition hover:border-brand-purple/35 hover:bg-brand-purple/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
            >
              <span className="flex min-w-0 items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-purple/35 bg-brand-purple/10 text-brand-purple">
                  <Shield className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white">
                    Team
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-brand-muted">
                    Production and ops login
                  </span>
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-brand-muted transition group-hover:translate-x-0.5 group-hover:text-brand-purple"
                aria-hidden="true"
              />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
