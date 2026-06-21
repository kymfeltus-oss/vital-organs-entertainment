"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import ExperienceDashboardGridCard from "@/components/experience/dashboard/ExperienceDashboardGridCard";
import ExperienceDashboardStoryCard from "@/components/experience/dashboard/ExperienceDashboardStoryCard";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import {
  AWAKENING_ASSETS,
  AWAKENING_CONCERT_BACKDROP_ART,
  AWAKENING_DASHBOARD_BUTTON_GRID,
  AWAKENING_DASHBOARD_OVERLAY_LAYOUT,
  AWAKENING_DASHBOARD_STORY_TOP_Y,
} from "@/lib/experience/awakening-dashboard-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";
import { MOBILE_ARTBOARD_REF, mobileArtboardStageStyle } from "@/lib/responsive";

type ExperienceDashboardInterfaceLayerProps = {
  headerDisplayName: string;
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardInterfaceLayer({
  headerDisplayName,
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
      <div
        className="experience-dashboard-artboard"
        style={
          {
            ...mobileArtboardStageStyle({ native: MOBILE_ARTBOARD_REF }),
            "--dash-story-top-y": AWAKENING_DASHBOARD_STORY_TOP_Y,
            "--dash-safe-top": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.top,
            "--dash-safe-right": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.right,
            "--dash-safe-bottom": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.bottom,
            "--dash-safe-left": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.left,
            "--dash-overlay-card-gap": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.dashboardCardGap,
            "--dashboard-page-padding": `${AWAKENING_DASHBOARD_OVERLAY_LAYOUT.contentTrackPadding}px`,
            "--dashboard-card-gap": `${AWAKENING_DASHBOARD_OVERLAY_LAYOUT.dashboardCardGap}px`,
            "--dash-dashboard-card-gap": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.dashboardCardGap,
            "--dash-action-cell-padding": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.actionCellPadding,
            "--dash-grid-top-offset": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.gridTopOffset,
            "--dash-artboard-scroll-h": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.artboardScrollHeight,
            "--dash-artboard-h": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.artboardHeight,
            "--dash-artboard-w": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.artboardWidth,
          } as CSSProperties
        }
      >
        <video
          ref={backgroundRef}
          src={AWAKENING_ASSETS.background}
          className="experience-dashboard-artboard__bg"
          width={AWAKENING_CONCERT_BACKDROP_ART.width}
          height={AWAKENING_CONCERT_BACKDROP_ART.height}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        <div className="experience-dashboard-artboard__overlay">
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

          <div className="experience-dashboard-overlay__stack dashboard-page">
            <div className="experience-dashboard-overlay__content-band dashboard-card-stack">
              <ExperienceDashboardStoryCard headerDisplayName={headerDisplayName} />

              <nav
                className="dashboard-action-grid experience-dashboard-overlay__grid"
                aria-label="Dashboard shortcuts"
              >
                {AWAKENING_DASHBOARD_BUTTON_GRID.map((button) => (
                  <ExperienceDashboardGridCard
                    key={button.id}
                    href={button.href}
                    src={button.src}
                    ariaLabel={button.ariaLabel}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
