import type { TenantTheme } from "@/lib/theme/types";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";

/** Prayer & contact destinations — resolves from active tenant theme. */

export function resolvePrayerContact(theme: TenantTheme = DEFAULT_TENANT_THEME) {
  const email = theme.contact.email;
  return {
    email,
    website: theme.contact.website,
    prayerRequestMailto: `mailto:${email}?subject=${encodeURIComponent("Prayer Request")}&body=${encodeURIComponent("Please share your prayer request below:\n\n")}`,
    emailMailto: `mailto:${email}`,
  } as const;
}

/** @deprecated Use resolvePrayerContact(theme) — static default for legacy imports. */
export const PRAYER_CONTACT_EMAIL = DEFAULT_TENANT_THEME.contact.email;

/** @deprecated Use resolvePrayerContact(theme) — static default for legacy imports. */
export const PRAYER_CONTACT = resolvePrayerContact(DEFAULT_TENANT_THEME);

export function buildContactMailto(
  input: {
    fullName: string;
    email: string;
    subject: string;
    message: string;
  },
  theme: TenantTheme = DEFAULT_TENANT_THEME,
): string {
  const contact = resolvePrayerContact(theme);
  const subject =
    input.subject.trim() || theme.contact.mailSubjectPrefix;
  const body = [
    `Name: ${input.fullName.trim()}`,
    `Email: ${input.email.trim()}`,
    "",
    input.message.trim(),
  ].join("\n");

  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function resolveSocialLinks(theme: TenantTheme = DEFAULT_TENANT_THEME) {
  return theme.socialLinks;
}

/** @deprecated Use resolveSocialLinks(theme) — static default for legacy imports. */
export const PRAYER_SOCIAL_LINKS = DEFAULT_TENANT_THEME.socialLinks;
