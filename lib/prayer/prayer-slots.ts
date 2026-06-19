import { PRAYER_CONTACT, PRAYER_SOCIAL_LINKS } from "@/lib/prayer/contact";
import { MOBILE_ARTBOARD_BACK_HOTSPOT } from "@/lib/navigation/back-to-dashboard";

export type PrayerActionSlot = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Top-left chevron — routes to attendee dashboard. */
export const PRAYER_BACK_SLOT = MOBILE_ARTBOARD_BACK_HOTSPOT;

/** Percentage hit targets on the 853×1844 artboard — tune against prayer.png. */
export const PRAYER_PRIMARY_ACTIONS: readonly PrayerActionSlot[] = [
  {
    id: "request-prayer",
    label: "Request prayer",
    href: PRAYER_CONTACT.prayerRequestMailto,
    external: true,
    left: "9%",
    top: "55.8%",
    width: "82%",
    height: "5.8%",
  },
  {
    id: "contact-email",
    label: `Email ${PRAYER_CONTACT.email}`,
    href: PRAYER_CONTACT.emailMailto,
    external: true,
    left: "8%",
    top: "63.2%",
    width: "84%",
    height: "5.5%",
  },
  {
    id: "contact-email-action",
    label: "Send email",
    href: PRAYER_CONTACT.emailMailto,
    external: true,
    left: "78%",
    top: "63.2%",
    width: "14%",
    height: "5.5%",
  },
  {
    id: "contact-website",
    label: "Visit website",
    href: PRAYER_CONTACT.website,
    external: true,
    left: "8%",
    top: "70.8%",
    width: "84%",
    height: "5.5%",
  },
  {
    id: "contact-website-action",
    label: "Open website",
    href: PRAYER_CONTACT.website,
    external: true,
    left: "78%",
    top: "70.8%",
    width: "14%",
    height: "5.5%",
  },
] as const;

/** Five social icons — centered on artboard scan (~y 1740). */
export const PRAYER_SOCIAL_ACTIONS: readonly PrayerActionSlot[] = [
  {
    id: PRAYER_SOCIAL_LINKS[0].id,
    label: PRAYER_SOCIAL_LINKS[0].label,
    href: PRAYER_SOCIAL_LINKS[0].href,
    external: true,
    left: "13%",
    top: "91.2%",
    width: "11%",
    height: "5.5%",
  },
  {
    id: PRAYER_SOCIAL_LINKS[1].id,
    label: PRAYER_SOCIAL_LINKS[1].label,
    href: PRAYER_SOCIAL_LINKS[1].href,
    external: true,
    left: "29%",
    top: "91.2%",
    width: "11%",
    height: "5.5%",
  },
  {
    id: PRAYER_SOCIAL_LINKS[2].id,
    label: PRAYER_SOCIAL_LINKS[2].label,
    href: PRAYER_SOCIAL_LINKS[2].href,
    external: true,
    left: "45%",
    top: "91.2%",
    width: "11%",
    height: "5.5%",
  },
  {
    id: PRAYER_SOCIAL_LINKS[3].id,
    label: PRAYER_SOCIAL_LINKS[3].label,
    href: PRAYER_SOCIAL_LINKS[3].href,
    external: true,
    left: "61%",
    top: "91.2%",
    width: "11%",
    height: "5.5%",
  },
  {
    id: PRAYER_SOCIAL_LINKS[4].id,
    label: PRAYER_SOCIAL_LINKS[4].label,
    href: PRAYER_SOCIAL_LINKS[4].href,
    external: true,
    left: "77%",
    top: "91.2%",
    width: "11%",
    height: "5.5%",
  },
] as const;

export const PRAYER_ACTION_SLOTS: readonly PrayerActionSlot[] = [
  ...PRAYER_PRIMARY_ACTIONS,
  ...PRAYER_SOCIAL_ACTIONS,
];
