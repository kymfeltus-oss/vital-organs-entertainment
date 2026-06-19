"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
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

type ExperienceDashboardInterfaceLayerProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

export default function ExperienceDashboardInterfaceLayer({
  initialCountdownConfig,
}: ExperienceDashboardInterfaceLayerProps) {
  const backgroundRef = useRef<HTMLVideoElement>(null);
  const storyRef = useRef<HTMLAnchorElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  const { config, countdown, eventPhase, isLoading, showTimer } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
  });

  useEffect(() => {
    const story = storyRef.current;
    const grid = gridRef.current;
    const stack = stackRef.current;
    if (!story || !grid || !stack) return;

    const measureAlignment = (trigger: string) => {
      const storyRect = story.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const stackRect = stack.getBoundingClientRect();
      const leftDelta = Math.round((gridRect.left - storyRect.left) * 100) / 100;
      const rightDelta = Math.round((gridRect.right - storyRect.right) * 100) / 100;
      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "baf5b9",
        },
        body: JSON.stringify({
          sessionId: "baf5b9",
          runId: "dashboard-align",
          hypothesisId: "A-E",
          location: "ExperienceDashboardInterfaceLayer.tsx:measureAlignment",
          message: "Dashboard card edge alignment",
          data: {
            trigger,
            storyLeft: Math.round(storyRect.left),
            storyRight: Math.round(storyRect.right),
            storyWidth: Math.round(storyRect.width),
            gridLeft: Math.round(gridRect.left),
            gridRight: Math.round(gridRect.right),
            gridWidth: Math.round(gridRect.width),
            stackLeft: Math.round(stackRect.left),
            stackRight: Math.round(stackRect.right),
            leftDelta,
            rightDelta,
            aligned: Math.abs(leftDelta) < 1 && Math.abs(rightDelta) < 1,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };

    measureAlignment("mount");
    const resizeObserver = new ResizeObserver(() => measureAlignment("resize"));
    resizeObserver.observe(stack);
    window.addEventListener("orientationchange", () => measureAlignment("orientation"));

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", () => measureAlignment("orientation"));
    };
  }, []);

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
            "--dash-story-top-y": AWAKENING_DASHBOARD_STORY_TOP_Y,
            "--dash-safe-top": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.top,
            "--dash-safe-right": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.right,
            "--dash-safe-bottom": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.bottom,
            "--dash-safe-left": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.safeArea.left,
            "--dash-overlay-card-gap": AWAKENING_DASHBOARD_OVERLAY_LAYOUT.overlayCardGap,
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

          <div
            ref={stackRef}
            className="experience-dashboard-overlay__stack dashboard-page"
          >
            <div className="experience-dashboard-overlay__content-band dashboard-card-stack">
            <Link
              ref={storyRef}
              href={AWAKENING_ASSETS.routes.watchStory}
              className="experience-dashboard-overlay__story dashboard-card touch-target"
              aria-label="Watch Ian Craig's healing journey"
            >
              <img
                src={AWAKENING_ASSETS.ianCraigStoryPoster}
                alt=""
                width={1536}
                height={1024}
                className="experience-dashboard-overlay__story-img"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            </Link>

            <nav
              ref={gridRef}
              className="experience-dashboard-overlay__grid dashboard-card-grid"
              aria-label="Dashboard shortcuts"
            >
              {AWAKENING_DASHBOARD_BUTTON_GRID.map((button) => (
                <Link
                  key={button.id}
                  href={button.href}
                  className="experience-dashboard-overlay__card dashboard-card touch-target"
                  aria-label={button.ariaLabel}
                >
                  <img
                    src={button.src}
                    alt=""
                    width={1254}
                    height={1254}
                    className="experience-dashboard-overlay__card-img"
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
      </div>
    </div>
  );
}
