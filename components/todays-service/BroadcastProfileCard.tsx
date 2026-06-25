"use client";

import { Star } from "lucide-react";
import { BROADCAST_PROFILE_FEATURES } from "@/lib/todays-service/coaching";
import { TS } from "@/components/todays-service/ServiceUi";

type BroadcastProfileCardProps = {
  profileName: string;
  onChangeProfile: () => void;
};

export default function BroadcastProfileCard({
  profileName,
  onChangeProfile,
}: BroadcastProfileCardProps) {
  return (
    <section
      className={`${TS.panel} rounded-xl border-[#53fc18]/25 p-5 shadow-[0_0_30px_rgba(83,252,24,0.12)]`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-[#00f2ff]">
            Today&apos;s Broadcast
          </p>
          <h2 className="mt-1 flex flex-wrap items-center gap-2 font-headline text-xl uppercase tracking-[0.08em] text-white md:text-2xl">
            <Star className="h-5 w-5 shrink-0 fill-[#53fc18] text-[#53fc18]" aria-hidden="true" />
            {profileName}
          </h2>
          <p className={`mt-3 ${TS.secondaryMuted} font-bold tracking-[0.1em]`}>
            Automatically Configures:
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {BROADCAST_PROFILE_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-1.5 font-body text-[0.82rem] text-white/85"
              >
                <span className="text-[#53fc18]" aria-hidden="true">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={onChangeProfile} className={`shrink-0 ${TS.btnCyan}`}>
          Change Profile
        </button>
      </div>
    </section>
  );
}
