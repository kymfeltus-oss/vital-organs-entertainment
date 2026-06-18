/** Deterministic ambient FX seeds for the mobile intro splash (SSR-safe). */

export type IntroAmbientTone = "blue" | "pink";

export type IntroAmbientParticle = {
  id: string;
  leftPct: number;
  startTopPct: number;
  tone: IntroAmbientTone;
  sizePx: 3 | 4 | 5;
  riseVh: number;
  driftPx: number;
  delaySec: number;
  durationSec: number;
  peakOpacity: number;
};

export const INTRO_AMBIENT_PARTICLE_COUNT = 18;

const SIZE_CYCLE: Array<3 | 4 | 5> = [3, 4, 4, 5, 3, 5, 4, 3, 4, 5];

export const INTRO_AMBIENT_PARTICLES: IntroAmbientParticle[] = Array.from(
  { length: INTRO_AMBIENT_PARTICLE_COUNT },
  (_, index) => ({
    id: `ambient-${index}`,
    leftPct: 3 + ((index * 19) % 94),
    startTopPct: 54 + ((index * 11) % 40),
    tone: index % 2 === 0 ? "blue" : "pink",
    sizePx: SIZE_CYCLE[index % SIZE_CYCLE.length] ?? 4,
    riseVh: 36 + (index % 8) * 5,
    driftPx: -14 + (index % 7) * 4,
    delaySec: (index % 9) * 0.72,
    durationSec: 8.5 + (index % 6) * 1.35,
    peakOpacity: 0.42 + (index % 5) * 0.1,
  }),
);

export const INTRO_AMBIENT_FLARES = [
  {
    id: "flare-primary",
    top: "11%",
    width: "min(78vw, 22rem)",
    delaySec: 0,
    durationSec: 5.5,
  },
  {
    id: "flare-secondary",
    top: "15%",
    width: "min(62vw, 16rem)",
    delaySec: 1.8,
    durationSec: 6.8,
  },
] as const;
