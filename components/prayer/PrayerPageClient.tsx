"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import ContactUsForm, { type ContactUsFormValues } from "@/components/prayer/ContactUsForm";
import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import { buildContactMailto } from "@/lib/prayer/contact";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { CONTENT_WITH_NAV } from "@/lib/responsive";

type ContactUsPageClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ContactUsPageClient({ initialProfile }: ContactUsPageClientProps) {
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
    window.location.href = buildContactMailto(values);
    window.setTimeout(() => setIsSubmitting(false), 1200);
  };

  return (
    <div className={`contact-us-page ${CONTENT_WITH_NAV} min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-brand-black text-white`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-5 pt-safe sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={ATTENDEE_DASHBOARD_PATH}
              className="touch-target mb-4 inline-flex min-h-11 items-center gap-1 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-muted transition hover:text-brand-blue"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Back
            </Link>
            <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.24em] text-brand-blue">
              Vital Organs Entertainment
            </p>
            <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em] text-white">
              Contact Us
            </h1>
            <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-brand-muted">
              We&apos;d love to hear from you. Send a message and our team will get back to you soon.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-1">
            <ProfileOrbEditor profile={profile} onProfileChange={setProfile} size={40} />
            <AwakeningMenuButton className="shrink-0" />
          </div>
        </header>

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
      </div>
    </div>
  );
}

/** @deprecated Use ContactUsPageClient as default export. */
export { ContactUsPageClient as PrayerPageClient };
