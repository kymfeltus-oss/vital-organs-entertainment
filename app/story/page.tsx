import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_APP_NAME, PLATFORM_TAGLINE } from "@/lib/theme/brand";

const STORY_PREVIEW_SRC = "/tenant-default/vital-seed-story-preview-9x16.mp4";

export const metadata: Metadata = {
  title: `Featured Story | ${PLATFORM_APP_NAME}`,
  description: `A featured story preview from ${PLATFORM_APP_NAME}. ${PLATFORM_TAGLINE}`,
};

export default function StoryPage() {
  return (
    <main className="relative isolate h-dvh min-h-dvh overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_45%,rgba(0,168,255,0.22),transparent_34%),radial-gradient(circle_at_80%_55%,rgba(255,0,140,0.2),transparent_36%)]" />

      <video
        src={STORY_PREVIEW_SRC}
        className="absolute inset-0 h-full w-full object-cover opacity-30 blur-2xl scale-110"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex justify-center">
        <video
          src={STORY_PREVIEW_SRC}
          className="h-full w-full object-cover object-center sm:w-auto sm:max-w-full sm:object-contain"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="The Journey of Ian Craig preview"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/90" />

      <Link
        href="/attendee-dashboard"
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 inline-flex min-h-11 items-center rounded-full border border-white/25 bg-black/55 px-5 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md transition hover:border-cyan-300/70 hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        aria-label="Back to attendee dashboard"
      >
        Back
      </Link>

      <section className="absolute inset-x-0 bottom-[max(7rem,env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-xl flex-col items-center px-6 text-center">
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-cyan-100/90">
          The Journey of Ian Craig
        </p>
        <h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black uppercase tracking-[0.15em] text-transparent drop-shadow-[0_0_22px_rgba(255,255,255,0.3)] sm:text-5xl">
          Coming Soon
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
          His story of faith, healing, and purpose is on the way.
        </p>
      </section>
    </main>
  );
}
