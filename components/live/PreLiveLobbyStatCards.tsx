"use client";

import { Heart, Share2, Users } from "lucide-react";
import { EVENT_LOBBY } from "@/lib/live/event-lobby";

export default function PreLiveLobbyStatCards() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        { icon: Users, label: "Ready To Enter", value: EVENT_LOBBY.community.viewersReady },
        { icon: Heart, label: "Prayers Sent", value: EVENT_LOBBY.community.prayersSent },
        { icon: Share2, label: "Shares", value: EVENT_LOBBY.community.shares },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <stat.icon className="h-4 w-4" aria-hidden="true" />
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-zinc-500">
              {stat.label}
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {stat.value.toLocaleString("en-US")}
          </p>
        </div>
      ))}
    </div>
  );
}
