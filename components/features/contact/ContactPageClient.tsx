"use client";

import { useMemo, useState, type FormEvent } from "react";
import ContactUsForm, { type ContactUsFormValues } from "@/components/features/contact/ContactUsForm";
import GenericTabShell from "@/components/ui/shell/GenericTabShell";
import BrandLogo from "@/components/ui/layout/BrandLogo";
import { buildContactMailto } from "@/lib/prayer/contact";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { useTheme } from "@/components/theme/ThemeProvider";

type ContactUsPageClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ContactUsPageClient({ initialProfile }: ContactUsPageClientProps) {
  const { theme } = useTheme();
  const [profile, setProfile] = useState(initialProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<ContactUsFormValues>(() => ({
    fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim(),
    email: profile.email ?? "",
    subject: "",
    message: "",
  }));

  const canSubmit = useMemo(
    () =>
      values.fullName.trim().length > 0 &&
      isValidEmail(values.email) &&
      values.subject.trim().length > 0 &&
      values.message.trim().length > 0 &&
      !isSubmitting,
    [isSubmitting, values],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!values.fullName.trim()) {
      setFormError("Enter your full name.");
      return;
    }

    if (!isValidEmail(values.email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!values.subject.trim()) {
      setFormError("Enter a subject.");
      return;
    }

    if (!values.message.trim()) {
      setFormError("Enter your message.");
      return;
    }

    if (!canSubmit) return;

    setIsSubmitting(true);
    window.location.href = buildContactMailto(values, theme);
    window.setTimeout(() => setIsSubmitting(false), 1200);
  };

  return (
    <GenericTabShell
      title="Contact & Prayer"
      subtitle="We'd love to hear from you"
      profile={profile}
      onProfileChange={setProfile}
    >
      <div className="mb-6 flex justify-center">
        <BrandLogo size="lg" />
      </div>
      <p className="mb-6 text-center text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        Send a message or prayer request and our team will get back to you soon.
      </p>
      <ContactUsForm
        values={values}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        formError={formError}
        onFieldChange={(key, value) => {
          setValues((current) => ({ ...current, [key]: value }));
        }}
        onSubmit={handleSubmit}
      />
    </GenericTabShell>
  );
}

/** @deprecated Use ContactUsPageClient as default export. */
export { ContactUsPageClient as PrayerPageClient };
