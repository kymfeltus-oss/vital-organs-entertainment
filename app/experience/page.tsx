"use client";

import Link from "next/link";

export default function ExperiencePage() {
  return (
    <main className="relative flex h-dvh min-h-screen w-full items-center justify-center overflow-hidden bg-[#0B090A]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(224,36,148,0.22),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(0,240,255,0.12),transparent_40%)]"
      />

      <div className="relative z-10 max-w-md px-6 text-center">
        <img
          src="/logo.png"
          alt="300 Awakening"
          className="mx-auto w-[min(72vw,280px)] drop-shadow-[0_0_35px_rgba(255,0,180,0.7)]"
        />

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-white/80">
          The Experience Awaits
        </p>

        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Step into the awakening room, connect with the movement, and continue
          your journey.
        </p>

        <Link
          href="/email-gate"
          className="mt-10 inline-flex rounded-full border border-pink-400/70 bg-black/30 px-10 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_30px_rgba(255,0,140,0.45)] transition hover:border-pink-300 hover:brightness-110"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
