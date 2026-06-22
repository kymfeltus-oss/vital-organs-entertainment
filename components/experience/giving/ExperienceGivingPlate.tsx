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
  VITAL_SEED_GIVING_ASSETS,
  VITAL_SEED_GIVING_HERO_CROP_RATIO,
  VITAL_SEED_GIVING_MOBILE_ART_NATIVE,
} from "@/lib/vital-seed/giving-assets";

type ExperienceGivingPlateProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  children: ReactNode;
};

const heroNativeHeight = Math.round(
  VITAL_SEED_GIVING_MOBILE_ART_NATIVE.height * VITAL_SEED_GIVING_HERO_CROP_RATIO,
);

export default function ExperienceGivingPlate({
  profile,
  onProfileChange,
  children,
}: ExperienceGivingPlateProps) {
  return (
    <div className="auth-login-page relative flex w-full flex-col items-center px-4 py-5 pt-safe sm:px-6 sm:py-8">
      <div className="auth-login-page__glow pointer-events-none" aria-hidden="true" />

      <div className="relative z-[1] w-full max-w-[28rem] pb-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <Link
            href={ATTENDEE_DASHBOARD_PATH}
            className="touch-target inline-flex min-h-11 items-center gap-1 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-muted transition hover:text-brand-blue"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size={40} />
            <AwakeningMenuButton className="shrink-0" />
          </div>
        </div>

        <header className="mb-6">
          <div
            className="relative mx-auto w-full max-w-[22rem] overflow-hidden"
            style={{
              aspectRatio: `${VITAL_SEED_GIVING_MOBILE_ART_NATIVE.width} / ${heroNativeHeight}`,
            }}
          >
            <Image
              src={VITAL_SEED_GIVING_ASSETS.mobileBackground}
              alt="Vital Seed Giving"
              width={VITAL_SEED_GIVING_MOBILE_ART_NATIVE.width}
              height={VITAL_SEED_GIVING_MOBILE_ART_NATIVE.height}
              priority
              sizes="(max-width: 640px) 88vw, 352px"
              className="absolute left-0 top-0 max-w-none object-cover object-top"
              style={{
                width: "100%",
                height: `${100 / VITAL_SEED_GIVING_HERO_CROP_RATIO}%`,
              }}
            />
          </div>
        </header>

        <div className="glass-panel rounded-[1.25rem] border border-brand-border p-5 shadow-[0_0_40px_rgba(0,168,255,0.06)] sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
