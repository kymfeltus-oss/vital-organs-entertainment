"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import {
  BUY_SEEDS_ASSETS,
  BUY_SEEDS_HERO_CROP_RATIO,
  BUY_SEEDS_HERO_WIDTH_SCALE,
  BUY_SEEDS_MOBILE_ART_NATIVE,
} from "@/lib/seeds/assets";

type BuySeedsPlateProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  children: ReactNode;
};

export default function BuySeedsPlate({
  profile,
  onProfileChange,
  children,
}: BuySeedsPlateProps) {
  const heroBleed = ((BUY_SEEDS_HERO_WIDTH_SCALE - 1) / 2) * 100;

  return (
    <div className="auth-login-page relative flex min-h-0 w-full flex-1 flex-col items-center px-4 py-2 pt-safe sm:px-6 sm:py-3">
      <div className="auth-login-page__glow pointer-events-none" aria-hidden="true" />

      <div className="relative z-[1] flex w-full max-w-[28rem] flex-col pb-2">
        <div className="mb-1.5 flex shrink-0 items-start justify-between gap-3">
          <Link
            href={ATTENDEE_DASHBOARD_PATH}
            className="touch-target inline-flex min-h-10 items-center gap-1 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-muted transition hover:text-brand-blue"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size={40} />
            <AwakeningMenuButton className="shrink-0" />
          </div>
        </div>

        <div className="relative z-0 mb-4 h-[clamp(7.5rem,17dvh,9.5rem)] w-full shrink-0 overflow-hidden">
          <Image
            src={BUY_SEEDS_ASSETS.mobileBackground}
            alt="Buy Vital Seeds"
            width={BUY_SEEDS_MOBILE_ART_NATIVE.width}
            height={BUY_SEEDS_MOBILE_ART_NATIVE.height}
            priority
            sizes="(max-width: 640px) 100vw, 448px"
            className="absolute top-0 max-w-none object-cover object-top"
            style={{
              width: `${BUY_SEEDS_HERO_WIDTH_SCALE * 100}%`,
              left: `-${heroBleed}%`,
              height: `${100 / BUY_SEEDS_HERO_CROP_RATIO}%`,
            }}
          />
        </div>

        <div className="glass-panel relative z-[1] w-full shrink-0 overflow-hidden rounded-[1.25rem] border border-brand-border shadow-[0_0_40px_rgba(0,168,255,0.06)]">
          <div className="p-3.5 sm:p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
