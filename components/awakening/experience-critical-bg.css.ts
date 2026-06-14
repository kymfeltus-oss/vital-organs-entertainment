import { AWAKENING_ASSETS } from "@/components/awakening/constants";

/** Canonical artboard — all scene plates share this pixel size and must scale together. */
export const EXPERIENCE_BG_ART = {
  width: 1536,
  height: 1024,
  aspect: 1536 / 1024,
} as const;

/**
 * Inline in /experience head so background layout paints before the main CSS bundle.
 * A single aspect-locked scene box keeps base, performers, beams, and crowd pixel-aligned.
 */
export const EXPERIENCE_CRITICAL_BG_CSS = `
[data-experience-bg-shell] {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: #000000;
  overflow: hidden;
}
[data-experience-bg-scene] {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: max(100vw, calc(100vh * ${EXPERIENCE_BG_ART.width} / ${EXPERIENCE_BG_ART.height}));
  height: max(100vh, calc(100vw * ${EXPERIENCE_BG_ART.height} / ${EXPERIENCE_BG_ART.width}));
  transform: translateX(-50%);
  aspect-ratio: ${EXPERIENCE_BG_ART.width} / ${EXPERIENCE_BG_ART.height};
}
[data-experience-bg-scene] img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}
[data-experience-bg-scene] img[data-layer="base"] {
  z-index: 0;
  opacity: 1;
}
[data-experience-bg-scene] img[data-layer="performers"] {
  z-index: 1;
  opacity: 1;
}
[data-experience-bg-scene] img[data-layer="lightBeams"] {
  z-index: 2;
  opacity: 1;
  mix-blend-mode: screen;
}
[data-experience-bg-scene] img[data-layer="crowd"] {
  z-index: 3;
  opacity: 1;
}
`;

export const EXPERIENCE_BG_FALLBACK_STYLE = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 0,
  pointerEvents: "none" as const,
  backgroundColor: "#000000",
  backgroundImage: `url(${AWAKENING_ASSETS.background.base})`,
  backgroundSize: `max(100vw, calc(100vh * ${EXPERIENCE_BG_ART.width} / ${EXPERIENCE_BG_ART.height})) auto`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center bottom",
};
