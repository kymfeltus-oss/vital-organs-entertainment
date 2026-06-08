"use client";

import Link from "next/link";
import { Clock, Heart, Share2, Sparkles } from "lucide-react";
import { EVENT_LOBBY } from "@/lib/live/event-lobby";

export default function PreLiveLobbySidePanels() {
  const handleShare = async () => {
    const shareUrl = window.location.origin;
    const shareData = {
      title: "300 Awakening Live",
      text: "Join me for the 300 Awakening live recording experience.",
      url: `${shareUrl}/dashboard/live`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user dismissed */
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  return (
    <aside className="flex flex-col gap-4">
        <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 backdrop-blur-sm">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
            Community Anticipation
          </p>
          <div className="mt-4 space-y-3">
            {EVENT_LOBBY.anticipationFeed.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-[#0B090A]/80 px-3 py-2"
              >
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#1E40AF]">
                  {item.author}
                </p>
                <p className="mt-1 text-sm text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 backdrop-blur-sm">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
            Event Updates
          </p>
          <div className="mt-4 space-y-3">
            {EVENT_LOBBY.updates.map((update) => (
              <div key={update.id} className="border-l-2 border-[#1E40AF]/60 pl-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white">
                  {update.label}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{update.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 backdrop-blur-sm">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
            Take Action
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="touch-target flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0B090A] px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-[#1E40AF]/50 hover:text-white"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share Event
            </button>
            <Link
              href="/prayer"
              className="touch-target flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0B090A] px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-[#B0267A]/50 hover:text-white"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              Prayer Request
            </Link>
            <Link
              href="/dashboard/vital-seed"
              className="touch-target flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0B090A] px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-[#1E40AF]/50 hover:text-white"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Vital Seed
            </Link>
            <Link
              href="/giving"
              className="touch-target flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0B090A] px-4 py-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-[#B0267A]/50 hover:text-white"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              Giving
            </Link>
          </div>
        </section>
    </aside>
  );
}
