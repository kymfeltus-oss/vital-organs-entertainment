/** Vital Seed giving plate + icon paths (`/public/images/vital-seed/`). */

export const VITAL_SEED_GIVING_ASSETS = {
  desktopBackground: "/images/vital-seed/desktop-background.png",
  mobileBackground: "/images/vital-seed/mobile-background.png",
  seedIcon: "/images/vital-seed/seed-icon.png",
  peopleIcon: "/images/vital-seed/people-icon.png",
  calendarIcon: "/images/vital-seed/calendar-icon.png",
  shieldIcon: "/images/vital-seed/shield-icon.png",
  heartIcon: "/images/vital-seed/heart-icon.png",
  lockIcon: "/images/vital-seed/lock-icon.png",
  pencilIcon: "/images/vital-seed/pencil-icon.png",
  activityIcon: "/images/vital-seed/activity-icon.png",
  infoIcon: "/images/vital-seed/info-icon.png",
  chevronRight: "/images/vital-seed/chevron-right.png",
  backspaceIcon: "/images/vital-seed/backspace-icon.png",
  waveDivider: "/images/vital-seed/wave-divider.png",
  vitalSeedOrb: "/images/vital-seed/vital-seed-orb.png",
  stripeLogo: "/images/vital-seed/stripe-logo.svg",
} as const;

export const VITAL_SEED_GIVING_DESKTOP_ART = {
  width: 1490,
  height: 1055,
} as const;

export const VITAL_SEED_GIVING_MOBILE_ART = {
  width: 941,
  height: 1672,
} as const;

export type VitalSeedGivingAssetKey = keyof typeof VITAL_SEED_GIVING_ASSETS;
