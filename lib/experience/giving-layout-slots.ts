/** Artboard aligned to desktop giving background (1693×929). */

import type { CSSProperties } from "react";

export const VITAL_GIVING_DESKTOP_ART = {
  width: 1693,
  height: 929,
} as const;

export type GivingPoint = {
  left: number;
  top: number;
  centerX?: boolean;
  centerY?: boolean;
};

export const VITAL_GIVING_POSITIONS = {
  heroAvailableLabel: { left: 56, top: 13.2 },
  heroAvailableAmount: { left: 56, top: 16 },
  heroSeedsLabel: { left: 74, top: 15.5 },
  heroSeedsAmount: { left: 74, top: 18.4 },

  quick25: { left: 13.5, top: 30.5 },
  quick50: { left: 22.5, top: 30.5 },
  quick100: { left: 31.5, top: 30.5 },
  quick250: { left: 40.5, top: 30.5 },
  quickCustom: { left: 48.5, top: 30.5 },

  seedLabel: { left: 4.5, top: 38.1 },
  seedValue: { left: 41.5, top: 37.8 },
  seedPencil: { left: 48.3, top: 38.5 },

  speakLifeTitle: { left: 4.5, top: 49.7 },
  speakLifeDeclaration: { left: 4.5, top: 52.6 },
  speakLifeScripture: { left: 36.7, top: 52.4 },

  calculatorTitle: { left: 57.2, top: 51.8 },
  calculatorAmount: { left: 54.8, top: 54.5, centerX: true },
  calculatorKeypad: { left: 51.6, top: 58.6, width: 11.8, height: 16.8 },

  stripeTitle: { left: 78.6, top: 51.8 },
  stripeSub: { left: 77.1, top: 55.2 },
  stripeLogo: { left: 79.8, top: 58.7, centerX: true },
  stripeTag: { left: 77.6, top: 64.7, centerX: true },
  stripeFoot: { left: 72.1, top: 71.8 },

  journeyTitle: { left: 4.5, top: 69 },
  journeyMetric1Icon: { left: 5.2, top: 73.4 },
  journeyMetric1Label: { left: 8.8, top: 73.2 },
  journeyMetric1Value: { left: 8.8, top: 75.6 },
  journeyMetric2Icon: { left: 5.2, top: 78.2 },
  journeyMetric2Label: { left: 8.8, top: 78 },
  journeyMetric2Value: { left: 8.8, top: 80.4 },
  journeyMetric3Icon: { left: 5.2, top: 83 },
  journeyMetric3Label: { left: 8.8, top: 82.8 },
  journeyMetric3Value: { left: 8.8, top: 85.2 },

  activityTitle: { left: 52, top: 69 },
  activity1Icon: { left: 52.4, top: 73.4 },
  activity1Title: { left: 55.2, top: 73.2 },
  activity1Date: { left: 55.2, top: 75.2 },
  activity1Amount: { left: 76.2, top: 73.6 },
  activity2Icon: { left: 52.4, top: 78.2 },
  activity2Title: { left: 55.2, top: 78 },
  activity2Date: { left: 55.2, top: 80 },
  activity2Amount: { left: 76.2, top: 78.4 },
  activity3Icon: { left: 52.4, top: 83 },
  activity3Title: { left: 55.2, top: 82.8 },
  activity3Date: { left: 55.2, top: 84.8 },
  activity3Amount: { left: 76.2, top: 83.2 },

  ctaTitle: { left: 50, top: 88.2, centerX: true },
  ctaSub: { left: 50, top: 93, centerX: true },
  ctaHit: { left: 3.5, top: 86.8, width: 93, height: 9.5 },
} as const;

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
