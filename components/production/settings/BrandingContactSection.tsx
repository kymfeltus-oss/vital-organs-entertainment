"use client";

import { Plus, Trash2 } from "lucide-react";
import ThemeFormField from "@/components/admin/branding/ThemeFormField";
import type { ThemeSocialLink, TenantTheme } from "@/lib/theme/types";

type BrandingContactSectionProps = {
  contact: TenantTheme["contact"];
  socialLinks: readonly ThemeSocialLink[];
  disabled?: boolean;
  onContactChange: (patch: Partial<TenantTheme["contact"]>) => void;
  onSocialLinksChange: (links: ThemeSocialLink[]) => void;
};

function slugifyLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "social-link";
}

export default function BrandingContactSection({
  contact,
  socialLinks,
  disabled = false,
  onContactChange,
  onSocialLinksChange,
}: BrandingContactSectionProps) {
  const addSocialLink = () => {
    onSocialLinksChange([
      ...socialLinks,
      { id: `social-${Date.now()}`, label: "New link", href: "https://" },
    ]);
  };

  const updateSocialLink = (index: number, patch: Partial<ThemeSocialLink>) => {
    const links = socialLinks.map((link, i) => {
      if (i !== index) return link;
      const label = patch.label ?? link.label;
      return {
        ...link,
        ...patch,
        id: patch.label ? slugifyLabel(label) : link.id,
      };
    });
    onSocialLinksChange(links);
  };

  const removeSocialLink = (index: number) => {
    onSocialLinksChange(socialLinks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ThemeFormField label="Support email" htmlFor="owner-contact-email">
          <input
            id="owner-contact-email"
            type="email"
            value={contact.email}
            disabled={disabled}
            onChange={(event) => onContactChange({ email: event.target.value })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </ThemeFormField>

        <ThemeFormField label="Website" htmlFor="owner-contact-website">
          <input
            id="owner-contact-website"
            type="url"
            value={contact.website}
            disabled={disabled}
            onChange={(event) => onContactChange({ website: event.target.value })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
          />
        </ThemeFormField>

        <ThemeFormField
          label="Mail subject prefix"
          htmlFor="owner-contact-subject"
          hint="Prepended to outbound contact form subjects"
        >
          <input
            id="owner-contact-subject"
            type="text"
            value={contact.mailSubjectPrefix}
            disabled={disabled}
            onChange={(event) => onContactChange({ mailSubjectPrefix: event.target.value })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm sm:col-span-2"
          />
        </ThemeFormField>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="theme-label">Social links</p>
          <button
            type="button"
            disabled={disabled}
            onClick={addSocialLink}
            className="theme-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add link
          </button>
        </div>

        <div className="space-y-3">
          {socialLinks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              No social links yet.
            </p>
          ) : null}
          {socialLinks.map((link, index) => (
            <div
              key={link.id}
              className="theme-card grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <ThemeFormField label="Label" htmlFor={`owner-social-label-${index}`}>
                <input
                  id={`owner-social-label-${index}`}
                  type="text"
                  value={link.label}
                  disabled={disabled}
                  onChange={(event) => updateSocialLink(index, { label: event.target.value })}
                  className="theme-input w-full rounded-xl px-3 py-2 text-sm"
                />
              </ThemeFormField>
              <ThemeFormField label="URL" htmlFor={`owner-social-href-${index}`}>
                <input
                  id={`owner-social-href-${index}`}
                  type="url"
                  value={link.href}
                  disabled={disabled}
                  onChange={(event) => updateSocialLink(index, { href: event.target.value })}
                  className="theme-input w-full rounded-xl px-3 py-2 text-sm font-mono"
                />
              </ThemeFormField>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeSocialLink(index)}
                  className="theme-button-secondary inline-flex size-10 items-center justify-center rounded-xl disabled:opacity-50"
                  aria-label={`Remove ${link.label}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
