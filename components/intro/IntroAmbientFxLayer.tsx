"use client";

import { type CSSProperties } from "react";
import {
  INTRO_AMBIENT_FLARES,
  INTRO_AMBIENT_PARTICLES,
  type IntroAmbientTone,
} from "@/lib/intro/introAmbientFx";

const TONE_GLOW: Record<IntroAmbientTone, string> = {
  blue: "var(--color-brand-blue, #00a8ff)",
  pink: "var(--color-brand-pink, #ff008c)",
};

type IntroAmbientFxLayerProps = {
  className?: string;
};

/**
 * GPU-composited intro ambience: rising particles + header lens flares.
 * Animations use transform/opacity only (no layout or filter on particles).
 */
export default function IntroAmbientFxLayer({ className = "" }: IntroAmbientFxLayerProps) {
  return (
    <div
      className={`intro-ambient-layer pointer-events-none absolute inset-0 z-2 overflow-hidden ${className}`.trim()}
      aria-hidden="true"
    >
      {INTRO_AMBIENT_FLARES.map((flare) => (
        <div
          key={flare.id}
          className="intro-ambient-flare"
          style={{
            top: flare.top,
            width: flare.width,
            animationDelay: `${flare.delaySec}s`,
            animationDuration: `${flare.durationSec}s`,
          }}
        />
      ))}

      <div className="intro-ambient-particle-field">
        {INTRO_AMBIENT_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className={`intro-ambient-particle intro-ambient-particle--${particle.tone}`}
            style={
              {
                left: `${particle.leftPct}%`,
                top: `${particle.startTopPct}%`,
                width: `${particle.sizePx}px`,
                height: `${particle.sizePx}px`,
                "--intro-rise-vh": `${particle.riseVh}vh`,
                "--intro-drift-px": `${particle.driftPx}px`,
                "--intro-peak-opacity": particle.peakOpacity,
                animationDelay: `${particle.delaySec}s`,
                animationDuration: `${particle.durationSec}s`,
                color: TONE_GLOW[particle.tone],
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
