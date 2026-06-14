/** Master stage background assets for /experience — image-only hub. */

export const MASTER_STAGE_ART = {
  width: 1535,
  height: 1024,
  aspect: 1535 / 1024,
} as const;

export const MASTER_STAGE_MOBILE_ART = {
  width: 853,
  height: 1844,
  aspect: 853 / 1844,
} as const;

export const ACTUAL_ASSET_MAP = {
  masterStageBackground: "/assets/experience/master-stage-background.webp",
  /** Mobile portrait base layer — sourced from public/experience/master-stage-background mobile-view.web (853×1844 PNG). */
  masterStageBackgroundMobile: "/assets/experience/master-stage-background-mobile.png",
} as const;
