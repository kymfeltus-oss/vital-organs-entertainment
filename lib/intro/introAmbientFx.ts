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

export const INTRO_AMBIENT_PARTICLE_COUNT = 56;

const SIZE_CYCLE: Array<3 | 4 | 5 | 6> = [4, 4, 5, 5, 3, 6, 4, 5, 4, 5, 6, 4];

const TONE_CYCLE: IntroAmbientTone[] = ["blue", "purple", "pink", "blue", "pink", "purple"];

export const INTRO_AMBIENT_PARTICLES: IntroAmbientParticle[] = Array.from(
  { length: INTRO_AMBIENT_PARTICLE_COUNT },
  (_, index) => ({
    id: `ambient-${index}`,
    leftPct: 2 + ((index * 17) % 96),
    startTopPct: 32 + ((index * 11) % 58),
    tone: TONE_CYCLE[index % TONE_CYCLE.length] ?? "blue",
    sizePx: SIZE_CYCLE[index % SIZE_CYCLE.length] ?? 4,
    riseVh: 30 + (index % 10) * 4.5,
    driftPx: -18 + (index % 9) * 4,
    delaySec: (index % 11) * 0.48,
    durationSec: 7 + (index % 7) * 1.1,
    peakOpacity: 0.58 + (index % 6) * 0.07,
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
