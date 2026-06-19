"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import ExperienceDashboardHeroBanner from "@/components/experience/dashboard/ExperienceDashboardHeroBanner";
import {
  AWAKENING_ASSETS,
  AWAKENING_DASHBOARD_BUTTON_GRID,
} from "@/lib/experience/awakening-dashboard-assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

type ExperienceDashboardInterfaceLayerProps = {
  profile: AttendeeProfileSnapshot;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardInterfaceLayer({
  profile,
  initialCountdownConfig,
}: ExperienceDashboardInterfaceLayerProps) {
  const backgroundRef = useRef<HTMLVideoElement>(null);

  const { config, countdown, eventPhase, isLoading, showTimer } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
  });

  useEffect(() => {
    const video = backgroundRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay may require a user gesture on some browsers. */
      });
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.pause();
    };
  }, []);

  return (
    <div className="experience-dashboard-container">
      <video
        ref={backgroundRef}
        src={AWAKENING_ASSETS.background}
        className="experience-dashboard-bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className="experience-dashboard-content-overlay">
        {(showTimer || isLoading) && eventPhase === "waiting" ? (
          <div className="experience-dashboard-countdown-slot">
            <LobbyCountdownTimer
              config={config}
              countdown={countdown}
              eventPhase={eventPhase}
              showTimer={showTimer}
              isLoading={isLoading}
              variant="segmented"
            />
          </div>
        ) : null}

        <div className="experience-dashboard-hero-zone">
          <ExperienceDashboardHeroBanner profile={profile} />
        </div>

        <div className="experience-dashboard-bottom-zone">
          <nav className="experience-dashboard-button-grid" aria-label="Dashboard shortcuts">
            {AWAKENING_DASHBOARD_BUTTON_GRID.map((button) => (
              <Link
                key={button.id}
                href={button.href}
                className="experience-dashboard-button-grid__link touch-target"
                aria-label={button.ariaLabel}
              >
                <img
                  src={button.src}
                  alt=""
                  width={280}
                  height={148}
                  className="experience-dashboard-button-grid__img"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
