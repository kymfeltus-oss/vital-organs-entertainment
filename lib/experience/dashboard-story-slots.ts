import type { CSSProperties } from "react";

/** Ian Craig story card overlay slots — percentages on `ian craig story.png` (2752×1536). */

export const DASHBOARD_STORY_ART = {
  width: 2752,
  height: 1536,
} as const;

export type DashboardStoryRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Masks baked first-name art on the poster so live typography can replace it. */
export const DASHBOARD_STORY_WELCOME_MASK = {
  left: 3.5,
  top: 28,
  width: 28.5,
  height: 36,
} as const satisfies DashboardStoryRect;

/** Live WELCOME + first-name stack — left column inside the neon frame. */
export const DASHBOARD_STORY_WELCOME_STACK = {
  left: 5,
  top: 21.5,
  width: 24,
  height: 44,
} as const satisfies DashboardStoryRect;

/** WATCH NOW pill — bottom-right inside the poster art. */
export const DASHBOARD_STORY_WATCH_HIT = {
  left: 65.5,
  top: 67.5,
  width: 32,
  height: 22,
} as const satisfies DashboardStoryRect;

export function dashboardStoryRectStyle(rect: DashboardStoryRect): CSSProperties {
  return {
    position: "absolute",
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}
