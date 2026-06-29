"use client";

import PublicCountdownRings from "@/components/countdown/PublicCountdownRings";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import type { CountdownParts } from "@/lib/live/event-lobby";
import "@/styles/features/neon-countdown-stage.css";

type NeonCountdownStageProps = {
  countdown: CountdownParts;
  eventName?: string;
  eventPhase?: "waiting" | "live" | "ended";
  hostNames?: string[];
  startingShortly?: boolean;
  compact?: boolean;
};

export default function NeonCountdownStage({
  countdown,
  eventName = "IAN CRAIG & 300",
  eventPhase = "waiting",
  hostNames = [],
  startingShortly = false,
  compact = false,
}: NeonCountdownStageProps) {
  const cleanHosts = hostNames.map((host) => host.trim()).filter(Boolean);
  const isWaiting = eventPhase === "waiting";

  return (
    <section
      className={`neon-countdown-stage${compact ? " neon-countdown-stage--compact" : ""}`}
      aria-label={`${eventName} countdown`}
    >
      <div className="neon-countdown-stage__ambient" aria-hidden="true" />
      <div className="neon-countdown-stage__crowd" aria-hidden="true" />
      <div className="neon-countdown-stage__wave" aria-hidden="true" />

      <div className="neon-countdown-stage__content">
        <h1 className="sr-only">{eventName}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EXPERIENCE_BRAND_ASSETS.lockup}
          alt="Ian Craig and 300 Awakening — Live. Empower. Transform."
          width={1536}
          height={1024}
          className="neon-countdown-stage__lockup"
          loading="eager"
          decoding="async"
          draggable={false}
        />

        {cleanHosts.length ? (
          <p className="neon-countdown-stage__hosts font-ui">
            Hosted by {cleanHosts.join(" • ")}
          </p>
        ) : null}

        <p className="neon-countdown-stage__lead font-ui">
          {isWaiting
            ? startingShortly
              ? "The experience is starting now"
              : "The experience begins in"
            : eventPhase === "live"
              ? "The experience is live"
              : "Thank you for joining us"}
        </p>

        {isWaiting ? (
          <PublicCountdownRings countdown={countdown} compact={compact} />
        ) : (
          <div className="neon-countdown-stage__state font-headline">
            {eventPhase === "live" ? "LIVE" : "COMPLETE"}
          </div>
        )}
      </div>
    </section>
  );
}
