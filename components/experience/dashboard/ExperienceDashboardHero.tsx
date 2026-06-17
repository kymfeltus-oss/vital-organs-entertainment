"use client";

import Link from "next/link";
import { useRef } from "react";
import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import ExperienceDashboardCardRow from "@/components/experience/dashboard/ExperienceDashboardCardRow";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import { normalizeBackdropVariant } from "@/lib/experience/dashboard-beam-position";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { cn } from "@/lib/utils";

type ExperienceDashboardHeroProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  variant?: "mobile" | "desktop";
};

export default function ExperienceDashboardHero({
  profile,
  onProfileChange,
  variant = "desktop",
}: ExperienceDashboardHeroProps) {
  const backdropVariant = normalizeBackdropVariant(variant);
  const isMobile = backdropVariant === "mobile";
  const welcomeLine = `Welcome ${profile.headerDisplayName}`;
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const headlineBlockRef = useRef<HTMLDivElement>(null);

  const ctaLinkClass = cn(
    "dashboard-hero-cta-link w-full",
    !isMobile && "max-w-[300px]",
  );

  return (
    <section
      className={cn(
        "dashboard-hero z-10 mx-auto w-full bg-transparent",
        isMobile
          ? "relative px-2"
          : "absolute inset-0 overflow-hidden px-8",
      )}
      aria-label="Experience dashboard hero"
    >
      <div
        className={cn(
          "dashboard-hero-topbar pointer-events-auto w-full",
          isMobile && "relative mx-auto max-w-[calc(100%-3.25rem)] pr-14",
        )}
      >
        <div className="dashboard-hero-welcome mx-auto text-center">
          <h1 className="dashboard-hero-welcome-title">{welcomeLine}</h1>
          <p className="dashboard-hero-tagline">Tap Into The Awakening</p>
        </div>
      </div>

      {!isMobile ? (
        <div
          className="dashboard-hero-controls absolute z-50 flex items-center gap-1.5"
          style={{
            top: "max(0.35rem, env(safe-area-inset-top))",
            right: "max(0.75rem, env(safe-area-inset-right))",
          }}
        >
          <ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size="sm" />
          <AwakeningMenuButton />
        </div>
      ) : null}

      <div
        ref={headlineBlockRef}
        data-hero-measured="true"
        className="dashboard-hero-headline-block pointer-events-auto text-center"
      >
        <div className={cn("dashboard-hero-copy-stack", isMobile && "flex flex-col items-center gap-1.5")}>
          <div className="dashboard-hero-headline-anchor relative mx-auto px-2">
            <h2
              ref={headlineRef}
              className={cn(
                "dashboard-hero-headline text-white",
                "dashboard-hero-headline--alive",
              )}
            >
              THE AWAKENING IS OPEN
            </h2>
          </div>

          <p ref={subtitleRef} className="dashboard-hero-subtitle text-white">
            STEP INTO WORSHIP, PURPOSE AND IMPACT.
          </p>

          <div
            ref={ctaRef}
            className={cn(
              "dashboard-hero-cta-images mx-auto flex w-full items-center justify-center px-2",
              isMobile
                ? "flex-row"
                : "mt-4 flex-col gap-2 sm:flex-row sm:gap-3",
            )}
          >
            <Link href={AWAKENING_ASSETS.routes.enterExperience} className={ctaLinkClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AWAKENING_ASSETS.ui.enterExperience}
                alt="Enter Experience"
                className="dashboard-hero-cta-img w-full h-auto"
              />
            </Link>

            <Link href={AWAKENING_ASSETS.routes.watchStory} className={ctaLinkClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AWAKENING_ASSETS.ui.watchStory}
                alt="Watch Ian's Story"
                className="dashboard-hero-cta-img w-full h-auto"
              />
            </Link>
          </div>

          {!isMobile ? <ExperienceDashboardCardRow variant="desktop" /> : null}
        </div>
      </div>

      {isMobile ? <ExperienceDashboardCardRow variant="mobile" /> : null}
    </section>
  );
}
