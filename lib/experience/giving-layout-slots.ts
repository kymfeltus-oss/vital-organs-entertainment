/** Artboard aligned to `main background.png` (1536×1024). */

import type { CSSProperties } from "react";

export const VITAL_GIVING_DESKTOP_ART = {
  width: 1536,
  height: 1024,
} as const;

/** Scale Y coords authored on 1693×929 mock to this PNG height ratio. */
const Y = (percent: number) => (percent * 929) / 1024;

export type GivingPoint = {
  left: number;
  top: number;
  centerX?: boolean;
  centerY?: boolean;
};

export type GivingRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const VITAL_GIVING_POSITIONS = {
  heroAvailableLabel: { left: 56, top: Y(13.2) },
  heroAvailableAmount: { left: 56, top: Y(16) },
  heroSeedsLabel: { left: 74, top: Y(15.5) },
  heroSeedsAmount: { left: 74, top: Y(18.4) },

  quick25: { left: 13.5, top: Y(30.5) },
  quick50: { left: 22.5, top: Y(30.5) },
  quick100: { left: 31.5, top: Y(30.5) },
  quick250: { left: 40.5, top: Y(30.5) },
  quickCustom: { left: 48.5, top: Y(30.5) },

  seedLabel: { left: 4.5, top: Y(38.1) },
  seedValue: { left: 41.5, top: Y(37.8) },
  seedPencil: { left: 48.3, top: Y(38.5) },

  speakLifeTitle: { left: 4.5, top: Y(49.7) },
  speakLifeDeclaration: { left: 4.5, top: Y(52.6) },
  speakLifeScripture: { left: 36.7, top: Y(52.4) },

  journeyTitle: { left: 4.5, top: Y(69) },
  journeyMetric1Icon: { left: 5.2, top: Y(73.4) },
  journeyMetric1Label: { left: 8.8, top: Y(73.2) },
  journeyMetric1Value: { left: 8.8, top: Y(75.6) },
  journeyMetric2Icon: { left: 5.2, top: Y(78.2) },
  journeyMetric2Label: { left: 8.8, top: Y(78) },
  journeyMetric2Value: { left: 8.8, top: Y(80.4) },
  journeyMetric3Icon: { left: 5.2, top: Y(83) },
  journeyMetric3Label: { left: 8.8, top: Y(82.8) },
  journeyMetric3Value: { left: 8.8, top: Y(85.2) },

  /** Bottom-middle panel on PNG — not the calculator column. */
  activityTitle: { left: 26.2, top: Y(69) },
  activity1Icon: { left: 27, top: Y(73.4) },
  activity1Title: { left: 29.8, top: Y(73.2) },
  activity1Date: { left: 29.8, top: Y(75.2) },
  activity1Amount: { left: 44.5, top: Y(73.6) },
  activity2Icon: { left: 27, top: Y(78.2) },
  activity2Title: { left: 29.8, top: Y(78) },
  activity2Date: { left: 29.8, top: Y(80) },
  activity2Amount: { left: 44.5, top: Y(78.4) },
  activity3Icon: { left: 27, top: Y(83) },
  activity3Title: { left: 29.8, top: Y(82.8) },
  activity3Date: { left: 29.8, top: Y(84.8) },
  activity3Amount: { left: 44.5, top: Y(83.2) },

  /** Bottom neon pill — measured on PNG inner text band, nudged down for optical center. */
  ctaHit: { left: 3, top: 87.1, width: 94, height: 7.6 },
} as const;

/** Panel rects on PNG (1536×1024) — content flows inside, no overflow. */
export const VITAL_GIVING_PANELS = {
  calculatorHeader: { left: 51.5, top: 41.5, width: 14.5, height: 10.5 },
  calculatorKeypad: { left: 52.4, top: 52.2, width: 13.2, height: 9.6 },
  stripe: { left: 67.8, top: 40.8, width: 28.8, height: 21.5 },
} as const satisfies Record<string, GivingRect>;

export function givingRectStyle(rect: GivingRect): CSSProperties {
  return {
    position: "absolute",
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}

export function givingPointStyle(point: GivingPoint): CSSProperties {
  const transforms: string[] = [];
  if (point.centerX) transforms.push("translateX(-50%)");
  if (point.centerY) transforms.push("translateY(-50%)");

  return {
    position: "absolute",
    left: `${point.left}%`,
    top: `${point.top}%`,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
  };
}
