"use client";

import TicketTierSelectionGrid from "@/components/live/TicketTierSelectionGrid";

type StreamPaywallOverlayProps = {
  variant?: "overlay" | "lockdown";
};

export default function StreamPaywallOverlay({
  variant = "overlay",
}: StreamPaywallOverlayProps) {
  if (variant === "lockdown") {
    return (
      <main className="relative flex min-h-dvh w-full flex-col bg-[#0B090A] px-4 pt-safe pb-safe text-white md:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,0.12),transparent_65%)]"
        />

        <div className="relative z-10 w-full py-6 text-center md:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Live Room
          </p>
          <h1 className="mt-4 text-xl font-bold uppercase tracking-widest text-white md:text-3xl">
            Virtual Access Required
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400">
            Choose your concert pass tier. Pro and VIP bundles include Vital Seeds
            for live-room emotes — save versus buying access and seed packs
            separately.
          </p>
        </div>

        <div className="relative z-10 w-full pb-8">
          <TicketTierSelectionGrid />
        </div>
      </main>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-[#0B090A]/94 p-4 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex w-full flex-1 flex-col justify-center">
        <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#1E40AF]">
          Stream Access Passes
        </p>
        <h2 className="mt-3 text-center text-base font-bold uppercase tracking-widest text-white md:text-lg">
          Unlock The Live Feed
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-400">
          Guest sessions can explore chat and metrics. Select a pass to unlock the
          HLS concert stage and optional seed bundles.
        </p>

        <TicketTierSelectionGrid className="mt-6 w-full" />
      </div>
    </div>
  );
}
