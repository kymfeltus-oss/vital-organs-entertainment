import { PRAYER_CONTACT } from "@/lib/prayer/contact";

export type ContactUsOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

function slot(left: number, top: number, width: number, height: number): ContactUsOverlayRect {
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

/** Absolute slots — measured on `contact-us.png` (941×1672). */
export const CONTACT_US_FIELD_SLOTS = {
  fullName: slot(20.5, 42.0, 24.9, 5.9),
  email: slot(64.5, 42.0, 21.8, 5.9),
  subject: slot(8.0, 48.0, 82.6, 5.0),
  message: slot(8.0, 53.9, 83.8, 13.9),
  submit: slot(8.0, 65.0, 83.8, 9.0),
  emailCard: slot(8.0, 76.1, 83.8, 7.8),
} as const satisfies Record<string, ContactUsOverlayRect>;

/** Hides baked PNG placeholder rows — live inputs sit on top. */
export const CONTACT_US_BAKED_FIELD_MASKS: ContactUsOverlayRect[] = [
  CONTACT_US_FIELD_SLOTS.fullName,
  CONTACT_US_FIELD_SLOTS.email,
  CONTACT_US_FIELD_SLOTS.subject,
  CONTACT_US_FIELD_SLOTS.message,
];

export function buildContactMailto(input: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const subject = input.subject.trim() || "Contact from 300 Awakening";
  const body = [
    `Name: ${input.fullName.trim()}`,
    `Email: ${input.email.trim()}`,
    "",
    input.message.trim(),
  ].join("\n");

  return `mailto:${PRAYER_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** @deprecated Use CONTACT_US_FIELD_SLOTS. */
export const PRAYER_ACTION_SLOTS = [] as const;
