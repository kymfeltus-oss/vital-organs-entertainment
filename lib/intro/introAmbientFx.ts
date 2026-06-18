/** Deterministic ambient FX seeds for the mobile intro splash (SSR-safe). */

export type IntroAmbientTone = "blue" | "purple" | "pink";

export type IntroAmbientParticle = {
  id: string;
  leftPct: number;
  startTopPct: number;
  tone: IntroAmbientTone;
  sizePx: 3 | 4 | 5 | 6;
  riseVh: number;
  driftPx: number;
  delaySec: number;
  durationSec: number;
  peakOpacity: number;
};

export type IntroAmbientOrb = {
  id: string;
  leftPct: number;
  topPct: number;
  tone: IntroAmbientTone;
  sizePx: number;
  driftXPx: number;
  driftYPx: number;
  delaySec: number;
  durationSec: number;
  peakOpacity: number;
};

export const INTRO_AMBIENT_PARTICLE_COUNT = 42;

const SIZE_CYCLE: Array<3 | 4 | 5 | 6> = [3, 4, 4, 5, 3, 5, 4, 6, 3, 4, 5, 4];

const TONE_CYCLE: IntroAmbientTone[] = ["blue", "purple", "pink", "blue", "pink", "purple"];

export const INTRO_AMBIENT_PARTICLES: IntroAmbientParticle[] = Array.from(
  { length: INTRO_AMBIENT_PARTICLE_COUNT },
  (_, index) => ({
    id: `ambient-${index}`,
    leftPct: 2 + ((index * 17) % 96),
    startTopPct: 38 + ((index * 13) % 52),
    tone: TONE_CYCLE[index % TONE_CYCLE.length] ?? "blue",
    sizePx: SIZE_CYCLE[index % SIZE_CYCLE.length] ?? 4,
    riseVh: 32 + (index % 10) * 4.5,
    driftPx: -18 + (index % 9) * 4,
    delaySec: (index % 11) * 0.55,
    durationSec: 7.5 + (index % 7) * 1.2,
    peakOpacity: 0.38 + (index % 6) * 0.09,
  }),
);

export const INTRO_AMBIENT_ORBS: IntroAmbientOrb[] = Array.from({ length: 14 }, (_, index) => ({
  id: `orb-${index}`,
  leftPct: 4 + ((index * 23) % 88),
  topPct: 8 + ((index * 19) % 78),
  tone: TONE_CYCLE[(index + 1) % TONE_CYCLE.length] ?? "purple",
  sizePx: 28 + (index % 5) * 14,
  driftXPx: -22 + (index % 6) * 9,
  driftYPx: -16 + (index % 5) * 8,
  delaySec: (index % 8) * 0.9,
  durationSec: 11 + (index % 6) * 2.4,
  peakOpacity: 0.22 + (index % 4) * 0.08,
}));

export const INTRO_AMBIENT_FLARES = [
  {
    id: "flare-primary",
    top: "9%",
    width: "min(82vw, 24rem)",
    delaySec: 0,
    durationSec: 5.5,
  },
  {
    id: "flare-secondary",
    top: "14%",
    width: "min(66vw, 18rem)",
    delaySec: 1.4,
    durationSec: 6.2,
  },
  {
    id: "flare-tertiary",
    top: "20%",
    width: "min(54vw, 14rem)",
    delaySec: 2.6,
    durationSec: 7.4,
  },
  {
    id: "flare-lower",
    top: "28%",
    width: "min(48vw, 12rem)",
    delaySec: 0.8,
    durationSec: 8.1,
  },
  {
    id: "flare-accent",
    top: "6%",
    width: "min(92vw, 28rem)",
    delaySec: 3.2,
    durationSec: 5.9,
  },
] as const;
