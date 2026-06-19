"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardHeroBannerProps = {
  profile: AttendeeProfileSnapshot;
};

const WAVEFORM_BARS = 14;

export default function ExperienceDashboardHeroBanner({
  profile,
}: ExperienceDashboardHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = AWAKENING_ASSETS.ianCraigStoryVideo;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    video.muted = false;
    video.playsInline = true;
    video.controls = true;
    video.preload = "metadata";

    return () => {
      video.pause();
    };
  }, [videoSrc]);

  return (
    <article
      className="integrated-creator-welcome-card experience-dashboard-hero-banner"
      aria-label="Welcome and Ian Craig journey"
    >
      <div className="experience-dashboard-hero-banner__inner">
        <section className="experience-dashboard-hero-banner__col experience-dashboard-hero-banner__col--welcome">
          <div className="experience-dashboard-welcome-stack experience-dashboard-hero-banner__welcome">
            <p className="experience-dashboard-welcome-label font-ui">Welcome</p>
            <h1 className="experience-dashboard-welcome-name font-headline">
              {profile.headerDisplayName}
            </h1>
          </div>
        </section>

        <section
          className="experience-dashboard-hero-banner__col experience-dashboard-hero-banner__col--creator"
          aria-label="Ian Craig"
        >
          <div className="experience-dashboard-hero-banner__creator-stage">
            <div className="experience-dashboard-hero-banner__waveforms" aria-hidden="true">
              <div className="experience-dashboard-hero-banner__waveforms-blue">
                {Array.from({ length: WAVEFORM_BARS }, (_, index) => (
                  <span
                    key={`blue-${index}`}
                    className="experience-dashboard-hero-banner__wave-bar experience-dashboard-hero-banner__wave-bar--blue"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  />
                ))}
              </div>
              <div className="experience-dashboard-hero-banner__waveforms-pink">
                {Array.from({ length: WAVEFORM_BARS }, (_, index) => (
                  <span
                    key={`pink-${index}`}
                    className="experience-dashboard-hero-banner__wave-bar experience-dashboard-hero-banner__wave-bar--pink"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  />
                ))}
              </div>
            </div>

            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                poster={AWAKENING_ASSETS.ianCraigStoryPoster}
                className="experience-dashboard-hero-banner__creator-media"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={AWAKENING_ASSETS.ianCraigStoryPoster}
                alt=""
                width={1536}
                height={1024}
                className="experience-dashboard-hero-banner__creator-media experience-dashboard-hero-banner__creator-media--portrait"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            )}
          </div>
        </section>

        <section className="experience-dashboard-hero-banner__col experience-dashboard-hero-banner__col--journey">
          <div className="experience-dashboard-hero-banner__journey-copy">
            <p className="experience-dashboard-hero-banner__journey-eyebrow font-ui">
              The Journey of
            </p>
            <h2 className="experience-dashboard-hero-banner__journey-title font-headline">
              Ian Craig
            </h2>
            <p className="experience-dashboard-hero-banner__journey-summary font-body">
              Discover the story behind 300 Awakening and the mission that continues to transform
              lives.
            </p>
          </div>

          <Link
            href={AWAKENING_ASSETS.routes.watchStory}
            className="experience-dashboard-hero-banner__watch-btn font-ui"
            aria-label="Watch Ian Craig's healing journey"
          >
            <span className="experience-dashboard-hero-banner__watch-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="currentColor" />
              </svg>
            </span>
            Watch Now
          </Link>
        </section>
      </div>
    </article>
  );
}
