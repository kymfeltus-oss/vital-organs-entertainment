"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function OwnerSoundError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#020405] p-6 text-white">
      <section className="w-full max-w-md border border-red-400/35 bg-[#080a0c] p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" aria-hidden />
        <h1 className="mt-4 font-headline text-3xl uppercase text-white">Sound Control Unavailable</h1>
        <p className="mt-2 font-body text-sm text-white/55">
          The owner sound workspace could not be rendered.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 border border-cyan-400/45 bg-cyan-400/10 px-4 font-ui text-xs font-black uppercase text-cyan-200 hover:bg-cyan-400/20"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try Again
        </button>
      </section>
    </main>
  );
}
