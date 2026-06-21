import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Contact Us page — mobile artboard (`/contact-us`, `/experience/contact-us`). */

export const CONTACT_US_ASSET_VERSION = "20260621-contact-v4";

export const CONTACT_US_ASSETS = {
  mobileBackground: `/contact us/contact-us.png?v=${CONTACT_US_ASSET_VERSION}`,
} as const;

/** Unified 1080×1920 stage — same as other tab artboards. */
export const CONTACT_US_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** Native plate pixel size (941×1672). */
export const CONTACT_US_MOBILE_ART_NATIVE = {
  width: 941,
  height: 1672,
} as const;

/** @deprecated Use CONTACT_US_* exports. */
export const PRAYER_ASSETS = {
  mobileBackground: CONTACT_US_ASSETS.mobileBackground,
} as const;

export const PRAYER_MOBILE_ART = CONTACT_US_MOBILE_ART;
export const PRAYER_MOBILE_ART_NATIVE = CONTACT_US_MOBILE_ART_NATIVE;
