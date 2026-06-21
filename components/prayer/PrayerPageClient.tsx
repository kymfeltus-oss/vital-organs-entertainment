"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import ContactUsMobileForm, { type ContactUsFormValues } from "@/components/prayer/ContactUsMobileForm";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import {
  CONTACT_US_ASSETS,
  CONTACT_US_MOBILE_ART_NATIVE,
} from "@/lib/prayer/assets";
import { buildContactMailto } from "@/lib/prayer/contact-slots";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_TAB_SHELL,
  MOBILE_ARTBOARD_TAB_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

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
    <div className={`contact-us-page prayer-page ${MOBILE_ARTBOARD_TAB_SHELL}`}>
      <div
        className={`contact-us-page__stage prayer-page__stage ${MOBILE_ARTBOARD_TAB_STAGE}`}
        style={
          mobileArtboardStageStyle({ native: CONTACT_US_MOBILE_ART_NATIVE }) as CSSProperties
        }
      >
        <div className={MOBILE_ARTBOARD_ART_FIT}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CONTACT_US_ASSETS.mobileBackground}
            alt="Contact us — We'd love to hear from you"
            width={CONTACT_US_MOBILE_ART_NATIVE.width}
            height={CONTACT_US_MOBILE_ART_NATIVE.height}
            className="contact-us-page__bg prayer-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
          />

          <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />

          <ContactUsMobileForm
            values={values}
            isSubmitting={isSubmitting}
            formError={formError}
            onFieldChange={(key, value) => {
              setValues((current) => ({ ...current, [key]: value }));
            }}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use ContactUsPageClient as default export. */
export { ContactUsPageClient as PrayerPageClient };
