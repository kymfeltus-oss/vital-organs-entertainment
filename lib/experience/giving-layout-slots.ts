/** Percentage slots aligned to Vital Seed giving background plates. */

import type { CSSProperties } from "react";
import {
  VITAL_SEED_GIVING_DESKTOP_ART,
  VITAL_SEED_GIVING_MOBILE_ART,
} from "@/lib/vital-seed/giving-assets";

export type GivingVariant = "desktop" | "mobile";

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

export type GivingPositions = {
  heroAvailableLabel: GivingPoint;
  heroAvailableAmount: GivingPoint;
  heroSeedsLabel: GivingPoint;
  heroSeedsAmount: GivingPoint;
  quick25: GivingPoint;
  quick50: GivingPoint;
  quick100: GivingPoint;
  quick250: GivingPoint;
  quickCustom: GivingPoint;
  seedLabel: GivingPoint;
  seedValue: GivingPoint;
  speakLifeTitle: GivingPoint;
  speakLifeDeclaration: GivingPoint;
  speakLifeQuote: GivingPoint;
  speakLifeScripture: GivingPoint;
  journeyTitle: GivingPoint;
  journeyMetric1Label: GivingPoint;
  journeyMetric1Value: GivingPoint;
  journeyMetric2Label: GivingPoint;
  journeyMetric2Value: GivingPoint;
  journeyMetric3Label: GivingPoint;
  journeyMetric3Value: GivingPoint;
  activityTitle: GivingPoint;
  viewAllActivity: GivingPoint;
  activity1Title: GivingPoint;
  activity1Date: GivingPoint;
  activity1Amount: GivingPoint;
  activity2Title: GivingPoint;
  activity2Date: GivingPoint;
  activity2Amount: GivingPoint;
  activity3Title: GivingPoint;
  activity3Date: GivingPoint;
  activity3Amount: GivingPoint;
  inlineError: GivingPoint;
};

export type GivingPanels = {
  calculatorHeader: GivingRect;
  calculatorKeypad: GivingRect;
  stripe: GivingRect;
  ctaHit: GivingRect;
};

export type GivingLayout = {
  art: { width: number; height: number };
  positions: GivingPositions;
  panels: GivingPanels;
};

/** Scale Y coords authored on 1693×929 mock to desktop PNG height ratio. */
const DESKTOP_Y = (percent: number) => (percent * 929) / VITAL_SEED_GIVING_DESKTOP_ART.height;

export const VITAL_GIVING_DESKTOP_ART = VITAL_SEED_GIVING_DESKTOP_ART;
export const VITAL_GIVING_MOBILE_ART = VITAL_SEED_GIVING_MOBILE_ART;

export const VITAL_GIVING_DESKTOP_POSITIONS = {
  heroAvailableLabel: { left: 56, top: DESKTOP_Y(13.2) },
  heroAvailableAmount: { left: 56, top: DESKTOP_Y(16) },
  heroSeedsLabel: { left: 74, top: DESKTOP_Y(15.5) },
  heroSeedsAmount: { left: 74, top: DESKTOP_Y(18.4) },

  quick25: { left: 13.5, top: DESKTOP_Y(30.5) },
  quick50: { left: 22.5, top: DESKTOP_Y(30.5) },
  quick100: { left: 31.5, top: DESKTOP_Y(30.5) },
  quick250: { left: 40.5, top: DESKTOP_Y(30.5) },
  quickCustom: { left: 48.5, top: DESKTOP_Y(30.5) },

  seedLabel: { left: 4.5, top: DESKTOP_Y(38.1) },
  seedValue: { left: 41.5, top: DESKTOP_Y(37.8) },

  speakLifeTitle: { left: 4.5, top: DESKTOP_Y(49.7) },
  speakLifeDeclaration: { left: 4.5, top: DESKTOP_Y(52.6) },
  speakLifeQuote: { left: 4.5, top: DESKTOP_Y(55.8) },
  speakLifeScripture: { left: 4.5, top: DESKTOP_Y(58.2) },

  journeyTitle: { left: 4.5, top: DESKTOP_Y(69) },
  journeyMetric1Label: { left: 8.8, top: DESKTOP_Y(73.2) },
  journeyMetric1Value: { left: 8.8, top: DESKTOP_Y(75.6) },
  journeyMetric2Label: { left: 8.8, top: DESKTOP_Y(78) },
  journeyMetric2Value: { left: 8.8, top: DESKTOP_Y(80.4) },
  journeyMetric3Label: { left: 8.8, top: DESKTOP_Y(82.8) },
  journeyMetric3Value: { left: 8.8, top: DESKTOP_Y(85.2) },

  activityTitle: { left: 26.2, top: DESKTOP_Y(69) },
  viewAllActivity: { left: 42, top: DESKTOP_Y(69.2) },
  activity1Title: { left: 29.8, top: DESKTOP_Y(73.2) },
  activity1Date: { left: 29.8, top: DESKTOP_Y(75.2) },
  activity1Amount: { left: 44.5, top: DESKTOP_Y(73.6) },
  activity2Title: { left: 29.8, top: DESKTOP_Y(78) },
  activity2Date: { left: 29.8, top: DESKTOP_Y(80) },
  activity2Amount: { left: 44.5, top: DESKTOP_Y(78.4) },
  activity3Title: { left: 29.8, top: DESKTOP_Y(82.8) },
  activity3Date: { left: 29.8, top: DESKTOP_Y(84.8) },
  activity3Amount: { left: 44.5, top: DESKTOP_Y(83.2) },

  inlineError: { left: 50, top: 96, centerX: true },
} satisfies GivingPositions;

export const VITAL_GIVING_DESKTOP_PANELS = {
  calculatorHeader: { left: 51.5, top: 41.5, width: 14.5, height: 10.5 },
  calculatorKeypad: { left: 52.4, top: 52.2, width: 13.2, height: 9.6 },
  stripe: { left: 67.8, top: 40.8, width: 28.8, height: 21.5 },
  ctaHit: { left: 3, top: 87.1, width: 94, height: 7.6 },
} satisfies GivingPanels;

export const VITAL_GIVING_MOBILE_POSITIONS = {
  heroAvailableLabel: { left: 10, top: 5.4 },
  heroAvailableAmount: { left: 10, top: 7.6 },
  heroSeedsLabel: { left: 58, top: 5.4 },
  heroSeedsAmount: { left: 58, top: 7.6 },

  quick25: { left: 7, top: 14.2 },
  quick50: { left: 22, top: 14.2 },
  quick100: { left: 37, top: 14.2 },
  quick250: { left: 52, top: 14.2 },
  quickCustom: { left: 67, top: 14.2 },

  seedLabel: { left: 8, top: 18.8 },
  seedValue: { left: 52, top: 18.6 },

  speakLifeTitle: { left: 8, top: 23.8 },
  speakLifeDeclaration: { left: 8, top: 26.2 },
  speakLifeQuote: { left: 8, top: 29.4 },
  speakLifeScripture: { left: 8, top: 31.6 },

  journeyTitle: { left: 8, top: 73.8 },
  journeyMetric1Label: { left: 16, top: 76.6 },
  journeyMetric1Value: { left: 16, top: 78.4 },
  journeyMetric2Label: { left: 16, top: 79.6 },
  journeyMetric2Value: { left: 16, top: 81.4 },
  journeyMetric3Label: { left: 16, top: 82.6 },
  journeyMetric3Value: { left: 16, top: 84.4 },

  activityTitle: { left: 8, top: 86.2 },
  viewAllActivity: { left: 58, top: 86.2 },
  activity1Title: { left: 16, top: 88.6 },
  activity1Date: { left: 16, top: 89.8 },
  activity1Amount: { left: 78, top: 88.8 },
  activity2Title: { left: 16, top: 91 },
  activity2Date: { left: 16, top: 92.2 },
  activity2Amount: { left: 78, top: 91.2 },
  activity3Title: { left: 16, top: 93.4 },
  activity3Date: { left: 16, top: 94.6 },
  activity3Amount: { left: 78, top: 93.6 },

  inlineError: { left: 50, top: 94, centerX: true },
} satisfies GivingPositions;

export const VITAL_GIVING_MOBILE_PANELS = {
  calculatorHeader: { left: 10, top: 34.8, width: 80, height: 7.5 },
  calculatorKeypad: { left: 14, top: 43.5, width: 72, height: 11.5 },
  stripe: { left: 10, top: 57.5, width: 80, height: 13.5 },
  ctaHit: { left: 5, top: 95.2, width: 90, height: 3.8 },
} satisfies GivingPanels;

/** @deprecated Use getGivingLayout(variant).positions */
export const VITAL_GIVING_POSITIONS = VITAL_GIVING_DESKTOP_POSITIONS;

/** @deprecated Use getGivingLayout(variant).panels */
export const VITAL_GIVING_PANELS = VITAL_GIVING_DESKTOP_PANELS;

export function getGivingLayout(variant: GivingVariant): GivingLayout {
  if (variant === "mobile") {
    return {
      art: VITAL_GIVING_MOBILE_ART,
      positions: VITAL_GIVING_MOBILE_POSITIONS,
      panels: VITAL_GIVING_MOBILE_PANELS,
    };
  }

  return {
    art: VITAL_GIVING_DESKTOP_ART,
    positions: VITAL_GIVING_DESKTOP_POSITIONS,
    panels: VITAL_GIVING_DESKTOP_PANELS,
  };
}

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
