"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GraphicsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#030607] p-6 text-white">
      <section className="w-full max-w-lg rounded border border-red-500/35 bg-[#0a0e10] p-8 text-center shadow-2xl">
        <AlertTriangle className="mx-auto h-9 w-9 text-red-400" />
        <h1 className="mt-4 font-headline text-3xl uppercase tracking-wide">Graphics workspace unavailable</h1>
        <p className="mt-2 font-body text-sm text-white/55">The operator workspace hit an unexpected error. Your saved graphics were not changed.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#00afe9] px-5 font-ui text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#37caff] active:translate-y-px">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </section>
    </main>
  );
}
