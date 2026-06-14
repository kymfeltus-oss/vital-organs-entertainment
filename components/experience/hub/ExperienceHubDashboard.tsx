"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import "@/styles/awakening.css";
import { ORB_ITEMS } from "@/components/awakening/constants";
import AudioPlayer from "@/components/experience/hub/AudioPlayer";
import ExperienceHubScene from "@/components/experience/hub/ExperienceHubScene";
import LiveBadge from "@/components/experience/hub/LiveBadge";
import MissionStoryCard from "@/components/experience/hub/MissionStoryCard";
import NeonAvatar from "@/components/experience/hub/NeonAvatar";
import OrbButton from "@/components/experience/hub/OrbButton";
import WelcomeBanner from "@/components/experience/hub/WelcomeBanner";
import {
  ACTUAL_ASSET_MAP,
  EXPERIENCE_HUB_LAYOUT,
  HUB_SPEC_COLORS,
  MASTER_STAGE_COMPOSITION,
  MOTION_VARIANTS,
} from "@/lib/experience/hub-design-tokens";
import type { ExperienceHubPayload } from "@/lib/experience/hub-content";
import { resolveHubOrbIcon } from "@/lib/experience/hub-orb-icons";
import { useExperienceHubLiveState } from "@/lib/experience/useExperienceHubLiveState";

type ExperienceHubDashboardProps = {
  initialPayload: ExperienceHubPayload;
};

export default function ExperienceHubDashboard({ initialPayload }: ExperienceHubDashboardProps) {
  const payload = useExperienceHubLiveState(initialPayload);
  const reduceMotion = useReducedMotion();
  const liveHref = payload.isStreamLive ? "/experience/live" : undefined;
  const ambientSrc = payload.ambientTracks[0]?.audioUrl ?? null;
  const orbitHint = payload.brand.orbitHint || "TAP AN ORB TO EXPLORE";
  const headline = payload.liveSkylineHeadline || "THE SANCTUARY STAGE IS OPEN";
  const subhead = payload.liveSkylineSubhead || "JOIN THOUSANDS IN WORSHIP, UNITY AND IMPACT.";

  return (
    <motion.main
      variants={MOTION_VARIANTS.fadeIn}
      initial="hidden"
      animate="visible"
      className="relative isolate min-h-dvh w-full overflow-x-hidden bg-transparent font-ui text-white selection:bg-[#FF007F]/30"
    >
      <ExperienceHubScene />

      <div className="relative z-[50] mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-4 pb-safe pt-safe md:px-16 lg:px-[64px] lg:pt-[44px]">
        <header className="relative z-[70] mb-3 flex min-h-[72px] w-full items-start justify-center lg:mb-4">
          <div
            className="pointer-events-auto fixed z-[70] hidden shrink-0 lg:block"
            style={{
              top: `calc(${MASTER_STAGE_COMPOSITION.logoTopPx}px + env(safe-area-inset-top, 0px))`,
              left: `calc(${MASTER_STAGE_COMPOSITION.leftCross.xPct}vw - ${MASTER_STAGE_COMPOSITION.logoLeftOfCrossCenterPx}px)`,
              width: `clamp(${EXPERIENCE_HUB_LAYOUT.logo.minWidth}px, 18vw, ${EXPERIENCE_HUB_LAYOUT.logo.maxWidth}px)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ACTUAL_ASSET_MAP.logo}
              alt="300 Awakening"
              className="h-auto w-full object-contain"
              onError={(event) => {
                event.currentTarget.src = ACTUAL_ASSET_MAP.logoFallback;
              }}
            />
          </div>

          <div
            className="flex w-[120px] shrink-0 justify-center lg:hidden"
            style={{ width: EXPERIENCE_HUB_LAYOUT.logo.mobileWidth }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ACTUAL_ASSET_MAP.logo}
              alt="300 Awakening"
              className="h-auto w-full object-contain"
              onError={(event) => {
                event.currentTarget.src = ACTUAL_ASSET_MAP.logoFallback;
              }}
            />
          </div>

          <div className="flex w-full flex-1 justify-center px-2 lg:px-[240px]">
            <WelcomeBanner user={payload.user} joinMessage={payload.welcome.joinMessage} />
          </div>

          <div className="absolute right-0 top-0 shrink-0">
            <NeonAvatar
              initials={payload.user.email ? payload.user.initials : null}
              menuHref={payload.menuHref}
              size={EXPERIENCE_HUB_LAYOUT.profile.size}
            />
          </div>
        </header>

        <section className="relative z-[50] flex flex-col items-center gap-2 text-center">
          <LiveBadge isLive={payload.isStreamLive} alwaysShow liveHref={liveHref} />
          <h1
            className="font-headline max-w-[920px] text-[clamp(2rem,4.8vw,3.4rem)] uppercase leading-none tracking-[0.06em]"
            style={{ color: "#ffffff", textShadow: "0 0 14px rgba(255,255,255,0.26)" }}
          >
            {headline}
          </h1>
          <p
            className="max-w-2xl font-ui text-[clamp(0.68rem,1.2vw,0.875rem)] uppercase tracking-[0.15em]"
            style={{ color: "rgba(255,255,255,0.86)" }}
          >
            {subhead}
          </p>
        </section>

        <div className="relative z-[50] mt-4 flex w-full justify-center lg:mt-5">
          <MissionStoryCard className="relative z-[50]" />
        </div>

        <section className="relative z-[60] mx-auto mt-5 grid w-full max-w-[980px] grid-cols-2 gap-x-6 gap-y-8 px-1 md:grid-cols-4 lg:mt-6">
          {ORB_ITEMS.map((orb, index) => (
            <OrbButton
              key={orb.id}
              title={orb.label}
              subtitle={orb.description}
              imageSrc={orb.image}
              imageFallback={"imageFallback" in orb ? orb.imageFallback : undefined}
              href={orb.href}
              fallbackIcon={resolveHubOrbIcon(orb.id)}
              delayIndex={index}
            />
          ))}
        </section>

        <footer className="relative z-[60] mt-auto flex w-full flex-col gap-5 pt-8 max-lg:pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:flex-row lg:items-end lg:justify-between lg:pt-10">
          <AudioPlayer
            audioSrc={ambientSrc}
            className="z-[80] w-full max-lg:mx-auto max-lg:max-w-[min(360px,calc(100vw-2rem))] lg:fixed lg:bottom-6 lg:left-8 lg:w-[min(360px,calc(100vw-4rem))]"
          />

          <div className="z-[80] mx-auto flex select-none flex-col items-center gap-1 pb-2 text-center lg:fixed lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:pb-0">
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={reduceMotion ? undefined : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChevronUp className="h-4 w-4" style={{ color: HUB_SPEC_COLORS.cyan }} aria-hidden="true" />
            </motion.div>
            <span className="font-ui text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
              {orbitHint}
            </span>
          </div>

          <div className="hidden w-[min(360px,calc(100vw-4rem))] lg:block" aria-hidden="true" />
        </footer>
      </div>
    </motion.main>
  );
}
