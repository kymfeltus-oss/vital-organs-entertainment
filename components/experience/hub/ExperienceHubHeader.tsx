"use client";

import Image from "next/image";
import type { ExperienceHubPayload } from "@/lib/experience/hub-content";
import { ACTUAL_ASSET_MAP, HUB_SPEC_GLOWS, hubSpecClasses } from "@/lib/experience/hub-design-tokens";
import WelcomeBanner from "@/components/experience/hub/WelcomeBanner";

type ExperienceHubHeaderProps = {
  payload: ExperienceHubPayload;
};

export default function ExperienceHubHeader({ payload }: ExperienceHubHeaderProps) {
  const { user, welcome, brand } = payload;

  return (
    <header className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="min-w-0 lg:justify-self-start">
        <p className={`${hubSpecClasses.label} text-[0.52rem] tracking-[0.34em] text-white/60`}>
          {brand.eyebrow}
        </p>
        <div className="relative mx-auto mt-1 h-[100px] w-[100px] lg:mx-0 lg:h-[140px] lg:w-[140px]">
          <Image
            src={ACTUAL_ASSET_MAP.logo}
            alt="300 Awakening"
            fill
            priority
            className="object-contain object-center lg:object-left"
            sizes="140px"
          />
        </div>
      </div>

      <div className="w-full lg:justify-self-center">
        <WelcomeBanner user={user} joinMessage={welcome.joinMessage} />
      </div>

      <div className="flex items-center justify-center lg:justify-end">
        {user.email && user.initials ? (
          <div
            className={`${hubSpecClasses.gradientBorder} flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full backdrop-blur-md`}
            style={{
              background: "rgba(5, 8, 18, 0.72)",
              boxShadow: HUB_SPEC_GLOWS.dual,
            }}
            aria-label={user.initials}
          >
            <span className={`${hubSpecClasses.label} text-xs tracking-[0.12em] text-white`}>
              {user.initials}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
