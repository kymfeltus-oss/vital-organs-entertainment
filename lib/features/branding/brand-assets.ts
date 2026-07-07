/** Tenant-default experience assets — paths under `/tenant-default/` and `/branding/`. */

export const EXPERIENCE_BRAND_ASSETS = {
  lockup: "/branding/awakening-lockup.png",
  wordmark: "/branding/awakening-wordmark.png",
  logo: "/branding/awakening-lockup.png",
  emblem: "/branding/awakening-lockup.png",
  countdownFrame: "/ui/countdown-frame.png",
  hallelujahCover: "/images/hallelujah-anyhow-cover.png",
} as const;

export type ExperienceBrandAssetKey = keyof typeof EXPERIENCE_BRAND_ASSETS;
