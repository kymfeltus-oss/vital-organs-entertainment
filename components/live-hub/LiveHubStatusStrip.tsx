"use client";

import { Lock, MessageCircle, ShieldCheck, Signal } from "lucide-react";

type LiveHubStatusStripProps = {
  networkOnline: boolean;
};

export default function LiveHubStatusStrip({ networkOnline }: LiveHubStatusStripProps) {
  return (
    <footer className="shrink-0 border-t border-white/10 bg-[#0B090A] px-5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-zinc-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[#93c5fd]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Secure Connection
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Data Protected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Signal className="h-3.5 w-3.5" aria-hidden="true" />
            Uptime 99.9%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{networkOnline ? "Network Online" : "Network Offline"}</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[#B0267A] transition hover:text-[#f5c2e0]"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Chat Now
          </button>
        </div>
      </div>
    </footer>
  );
}
