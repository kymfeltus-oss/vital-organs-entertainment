"use client";

import { Loader2 } from "lucide-react";
import { PRAYER_CONTACT } from "@/lib/prayer/contact";
import {
  CONTACT_US_BAKED_FIELD_MASKS,
  CONTACT_US_FIELD_SLOTS,
  type ContactUsOverlayRect,
} from "@/lib/prayer/contact-slots";
import type { CSSProperties, FormEvent, ReactNode } from "react";

export type ContactUsFormValues = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

type ContactUsMobileFormProps = {
  values: ContactUsFormValues;
  isSubmitting: boolean;
  formError?: string | null;
  onFieldChange: <K extends keyof ContactUsFormValues>(
    key: K,
    value: ContactUsFormValues[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function slotStyle(rect: ContactUsOverlayRect): CSSProperties {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function FormSlot({
  rect,
  children,
}: {
  rect: ContactUsOverlayRect;
  children: ReactNode;
}) {
  return (
    <div className="contact-us-form__slot" style={slotStyle(rect)}>
      {children}
    </div>
  );
}

export default function ContactUsMobileForm({
  values,
  isSubmitting,
  formError,
  onFieldChange,
  onSubmit,
}: ContactUsMobileFormProps) {
  return (
    <div className="contact-us-overlay pointer-events-none absolute inset-0 z-[3] size-full">
      {CONTACT_US_BAKED_FIELD_MASKS.map((rect, index) => (
        <div
          key={`contact-us-field-mask-${index}`}
          className="contact-us-form__field-mask"
          style={slotStyle(rect)}
          aria-hidden="true"
        />
      ))}

      <form
        onSubmit={onSubmit}
        className="contact-us-form pointer-events-auto"
        aria-label="Contact us"
        noValidate
      >
        <FormSlot rect={CONTACT_US_FIELD_SLOTS.fullName}>
          <label className="contact-us-form__field">
            <input
              type="text"
              required
              autoComplete="name"
              value={values.fullName}
              onChange={(event) => onFieldChange("fullName", event.target.value)}
              placeholder=""
              aria-label="Full name"
              className="contact-us-form__control contact-us-form__control--compact font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CONTACT_US_FIELD_SLOTS.email}>
          <label className="contact-us-form__field">
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              placeholder=""
              aria-label="Email address"
              className="contact-us-form__control contact-us-form__control--compact font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CONTACT_US_FIELD_SLOTS.subject}>
          <label className="contact-us-form__field">
            <input
              type="text"
              required
              value={values.subject}
              onChange={(event) => onFieldChange("subject", event.target.value)}
              placeholder=""
              aria-label="Subject"
              className="contact-us-form__control font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CONTACT_US_FIELD_SLOTS.message}>
          <label className="contact-us-form__field contact-us-form__field--message">
            <textarea
              required
              value={values.message}
              onChange={(event) => onFieldChange("message", event.target.value)}
              placeholder=""
              aria-label="Your message"
              className="contact-us-form__control contact-us-form__textarea font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CONTACT_US_FIELD_SLOTS.submit}>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Send message"
            className="contact-us-form__submit touch-target font-ui size-full"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
            ) : (
              <span className="sr-only">Send message</span>
            )}
          </button>
        </FormSlot>

        <FormSlot rect={CONTACT_US_FIELD_SLOTS.emailCard}>
          <a
            href={PRAYER_CONTACT.emailMailto}
            aria-label={`Email ${PRAYER_CONTACT.email}`}
            className="contact-us-form__email-hit touch-target size-full"
          />
        </FormSlot>

        {formError ? (
          <p role="alert" className="contact-us-form__error font-body">
            {formError}
          </p>
        ) : null}
      </form>
    </div>
  );
}
