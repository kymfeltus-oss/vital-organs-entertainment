/** Official 300 Awakening / Vital Organs experience assets — do not substitute. */

export const EXPERIENCE_BRAND_ASSETS = {
  logo: "/images/logo.png",
  emblem: "/branding/300-awakening-emblem.png",
  countdownFrame: "/ui/countdown-frame.png",
  hallelujahCover: "/images/hallelujah-anyhow-cover.png",
} as const;

export type ExperienceBrandAssetKey = keyof typeof EXPERIENCE_BRAND_ASSETS;
