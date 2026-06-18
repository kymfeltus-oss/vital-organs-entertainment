"use client";

import Link from "next/link";
import { useRef } from "react";
import ExperienceDashboardCardRow from "@/components/experience/dashboard/ExperienceDashboardCardRow";
import ExperienceDashboardMobileHeroLayout from "@/components/experience/dashboard/ExperienceDashboardMobileHeroLayout";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardHeroProps = {
  profile: AttendeeProfileSnapshot;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardHero({
  profile,
  initialCountdownConfig,
}: ExperienceDashboardHeroProps) {
  const { config, countdown, eventPhase, isLoading, showTimer } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
  });
  const welcomeLine = `Welcome ${profile.headerDisplayName}`;
  const headlineBlockRef = useRef<HTMLDivElement>(null);

  return (
    <section
      className="dashboard-hero dashboard-hero--mobile relative z-10 mx-auto h-full w-full bg-transparent"
      aria-label="Experience dashboard hero"
    >
      <ExperienceDashboardMobileHeroLayout headlineBlockRef={headlineBlockRef} />

      <div className="dashboard-hero-topbar pointer-events-none relative mx-auto w-full max-w-[calc(100%-3.25rem)] pr-14">
        <div className="dashboard-hero-welcome mx-auto text-center">
          <h1 className="dashboard-hero-welcome-title pointer-events-auto">{welcomeLine}</h1>
        </div>
      </div>

      <div
        ref={headlineBlockRef}
        className="dashboard-hero-headline-block dashboard-hero-headline-block--mobile-fixed pointer-events-none text-center"
      >
        <div className="dashboard-hero-copy-stack pointer-events-auto flex flex-col items-center gap-2">
          {(showTimer || isLoading || eventPhase === "ended") && (
            <div className="mx-auto w-full max-w-[min(100%,16rem)] px-2">
              <LobbyCountdownTimer
                config={config}
                countdown={countdown}
                eventPhase={eventPhase}
                showTimer={showTimer}
                isLoading={isLoading}
                variant="segmented"
              />
              {eventPhase === "waiting" && showTimer ? (
                <p className="mt-1 font-ui text-[0.5rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                  {config.status_label}
                </p>
              ) : null}
              {eventPhase === "ended" ? (
                <p className="mt-1 font-ui text-[0.5rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                  Experience Ended
                </p>
              ) : null}
            </div>
          )}

          <div className="dashboard-hero-cta-images mx-auto flex w-full flex-row items-center justify-center gap-2 px-2">
            <Link
              href={AWAKENING_ASSETS.routes.enterExperience}
              className="dashboard-hero-cta-hit touch-target"
              aria-label="Enter Experience"
            />
            <Link
              href={AWAKENING_ASSETS.routes.watchStory}
              className="dashboard-hero-cta-hit touch-target"
              aria-label="Watch Story"
            />
          </div>

          <ExperienceDashboardCardRow />
        </div>
      </div>
    </section>
  );
}
