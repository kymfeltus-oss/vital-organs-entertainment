"use client";

// @refresh reset
import Link from "next/link";
import { useRef } from "react";
import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import ExperienceDashboardCardRow from "@/components/experience/dashboard/ExperienceDashboardCardRow";
import ExperienceDashboardHeroMeasurer from "@/components/experience/dashboard/ExperienceDashboardHeroMeasurer";
import ExperienceDashboardMobileCardHits from "@/components/experience/dashboard/ExperienceDashboardMobileCardHits";
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

  return (
    <section
      className={cn(
        "dashboard-hero dashboard-hero--pic1 pointer-events-none z-10 mx-auto w-full bg-transparent",
        isMobile
          ? "dashboard-hero--mobile relative min-h-dvh px-2"
          : "absolute inset-0 overflow-hidden px-8",
      )}
      aria-label="Experience dashboard hero"
    >
      {!isMobile ? (
        <ExperienceDashboardHeroMeasurer
          variant={variant}
          headlineBlockRef={headlineBlockRef}
          ctaRef={ctaRef}
        />
      ) : null}

      <div
        className={cn(
          "dashboard-hero-topbar pointer-events-auto w-full",
          isMobile && "dashboard-hero-topbar--mobile",
        )}
      >
        <div className="dashboard-hero-welcome mx-auto text-center">
          <div
            className={cn(
              "dashboard-hero-welcome-lines",
              isMobile && "dashboard-hero-welcome-lines--plain",
            )}
          >
            <h1 className="dashboard-hero-welcome-title">{welcomeLine}</h1>
          </div>
          <p className="dashboard-hero-tagline">Tap Into The Awakening</p>
        </div>

        <div
          className={cn(
            "dashboard-hero-controls z-50 flex items-center",
            isMobile
              ? "dashboard-hero-controls--mobile"
              : "absolute gap-1.5",
          )}
          style={
            isMobile
              ? undefined
              : {
                  top: "max(0.35rem, env(safe-area-inset-top))",
                  right: "max(0.75rem, env(safe-area-inset-right))",
                }
          }
        >
          <ProfileOrbEditor
            profile={profile}
            onProfileChange={onProfileChange}
            size={isMobile ? 36 : "sm"}
          />
          {!isMobile ? <AwakeningMenuButton /> : null}
        </div>
      </div>

      {isMobile ? <div className="dashboard-hero-mobile-topbar-spacer" aria-hidden /> : null}

      <div
        ref={headlineBlockRef}
        className={cn(
          "dashboard-hero-headline-block pointer-events-auto text-center",
          isMobile && "dashboard-hero-headline-block--mobile-scroll",
        )}
      >
        <div className="dashboard-hero-copy-stack">
          <div className="dashboard-hero-headline-anchor relative mx-auto px-2">
            <h2 ref={headlineRef} className="dashboard-hero-headline">
              THE AWAKENING IS OPEN
            </h2>
          </div>

          <p ref={subtitleRef} className="dashboard-hero-subtitle">
            STEP INTO WORSHIP, PURPOSE AND IMPACT.
          </p>

          <div
            ref={ctaRef}
            className={cn(
              "dashboard-hero-cta-images mx-auto flex w-full flex-col items-center px-2",
              isMobile ? "gap-1.5" : "gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3",
            )}
          >
            <Link
              href={AWAKENING_ASSETS.routes.enterExperience}
              className="dashboard-hero-cta-link dashboard-hero-cta-link--enter touch-target"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AWAKENING_ASSETS.ui.enterExperience}
                alt="Enter Experience"
                width={1774}
                height={887}
                decoding="async"
                className="dashboard-hero-cta-img dashboard-hero-cta-img--enter"
              />
            </Link>

            <Link
              href={AWAKENING_ASSETS.routes.watchStory}
              className="dashboard-hero-cta-link dashboard-hero-cta-link--watch touch-target"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AWAKENING_ASSETS.ui.watchStory}
                alt="Watch Ian's Story"
                width={1774}
                height={887}
                decoding="async"
                className="dashboard-hero-cta-img dashboard-hero-cta-img--watch"
              />
            </Link>
          </div>

          {!isMobile ? <ExperienceDashboardCardRow /> : null}
        </div>
      </div>

      {isMobile ? <ExperienceDashboardMobileCardHits /> : null}
    </section>
  );
}
