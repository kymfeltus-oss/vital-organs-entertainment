"use client";

import Link from "next/link";
import { Monitor, ArrowLeft } from "lucide-react";

export default function LiveHubDesktopGate() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#0B090A] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(176,38,122,0.12),transparent_50%)]" />

      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-[#1E40AF]/35 bg-[#111111]/90 p-8 text-center shadow-[0_0_40px_rgba(30,64,175,0.15)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1E40AF]/40 bg-[#1E40AF]/10">
          <Monitor className="h-7 w-7 text-[#93c5fd]" aria-hidden="true" />
        </div>

        <p className="mt-6 text-[0.62rem] font-bold uppercase tracking-[0.32em] text-[#1E40AF]">
          Live Hub · Production Console
        </p>
        <h1 className="mt-3 text-2xl font-bold uppercase tracking-widest text-white">
          Desktop Required
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          The Live Hub operator cockpit requires a desktop viewport (1280px or wider) for
          vMix controls, stream preview, safety checks, and Go Live review. The public live
          experience remains fully mobile-friendly.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/ops"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#1E40AF]/60 bg-[#1E40AF]/15 px-6 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#93c5fd] transition hover:bg-[#1E40AF]/25"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ops Command Center
          </Link>
          <Link
            href="/experience/live"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-[#0B090A] px-6 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-[#B0267A]/50 hover:text-white"
          >
            Attendee Live Page
          </Link>
        </div>
      </section>
    </main>
  );
}
