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

        <nav className="experience-dashboard-button-grid" aria-label="Dashboard shortcuts">
          {AWAKENING_DASHBOARD_BUTTON_GRID.map((button) => (
            <Link
              key={button.id}
              href={button.href}
              className="experience-dashboard-button-grid__link touch-target"
              aria-label={button.ariaLabel}
            >
              {/* Native img — direct public asset path for reliable mobile loading */}
              <img
                src={button.src}
                alt=""
                width={210}
                height={111}
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
  );
}
