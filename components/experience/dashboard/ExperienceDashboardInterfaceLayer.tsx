"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import {
  AWAKENING_ASSETS,
  AWAKENING_DASHBOARD_BUTTON_GRID,
} from "@/lib/experience/awakening-dashboard-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

type ExperienceDashboardInterfaceLayerProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardInterfaceLayer({
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

        <main className="experience-dashboard-board" aria-label="300 Awakening dashboard">
          <header className="experience-dashboard-board__logo">
            <img
              src={AWAKENING_ASSETS.logo}
              alt="300 Awakening"
              width={320}
              height={120}
              className="experience-dashboard-board__logo-img"
              loading="eager"
              decoding="async"
              draggable={false}
            />
          </header>

          <Link
            href={AWAKENING_ASSETS.routes.watchStory}
            className="experience-dashboard-board__story touch-target"
            aria-label="Watch Ian Craig's healing journey"
          >
            <img
              src={AWAKENING_ASSETS.ianCraigStoryPoster}
              alt=""
              width={1536}
              height={1024}
              className="experience-dashboard-board__story-img"
              loading="eager"
              decoding="async"
              draggable={false}
            />
          </Link>

          <nav className="experience-dashboard-board__grid" aria-label="Dashboard shortcuts">
            {AWAKENING_DASHBOARD_BUTTON_GRID.map((button) => (
              <Link
                key={button.id}
                href={button.href}
                className="experience-dashboard-board__card touch-target"
                aria-label={button.ariaLabel}
              >
                <img
                  src={button.src}
                  alt=""
                  width={512}
                  height={512}
                  className="experience-dashboard-board__card-img"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                />
              </Link>
            ))}
          </nav>
        </main>
      </div>
    </div>
  );
}
