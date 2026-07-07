"use client";

import { Loader2, Mail, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { resolvePrayerContact } from "@/lib/prayer/contact";

export type ContactUsFormValues = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

type ContactUsFormProps = {
  values: ContactUsFormValues;
  isSubmitting: boolean;
  canSubmit: boolean;
  formError?: string | null;
  onFieldChange: <K extends keyof ContactUsFormValues>(
    key: K,
    value: ContactUsFormValues[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ContactUsForm({
  values,
  isSubmitting,
  canSubmit,
  formError,
  onFieldChange,
  onSubmit,
}: ContactUsFormProps) {
  const { theme } = useTheme();
  const contact = resolvePrayerContact(theme);

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="glass-panel w-full rounded-2xl p-5 sm:p-6"
        aria-label="Contact us"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="theme-label mb-1.5 block">Full name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={values.fullName}
              onChange={(event) => onFieldChange("fullName", event.target.value)}
              className="theme-input w-full rounded-xl px-4 py-3 text-sm"
              placeholder="Your name"
            />
          </label>

          <label className="block sm:col-span-1">
            <span className="theme-label mb-1.5 block">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              className="theme-input w-full rounded-xl px-4 py-3 text-sm"
              placeholder="you@example.com"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="theme-label mb-1.5 block">Subject</span>
          <input
            type="text"
            required
            value={values.subject}
            onChange={(event) => onFieldChange("subject", event.target.value)}
            className="theme-input w-full rounded-xl px-4 py-3 text-sm"
            placeholder="How can we help?"
          />
        </label>

        <label className="mt-4 block">
          <span className="theme-label mb-1.5 block">Message</span>
          <textarea
            required
            rows={5}
            value={values.message}
            onChange={(event) => onFieldChange("message", event.target.value)}
            className="theme-input w-full resize-y rounded-xl px-4 py-3 text-sm"
            placeholder="Share your message or prayer request"
          />
        </label>

        {formError ? (
          <p className="mt-4 text-sm" style={{ color: "var(--theme-accent)" }} role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="theme-button-primary touch-target mt-6 flex w-full min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Opening mail…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Send message
            </>
          )}
        </button>

        <a
          href={contact.emailMailto}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80"
          style={{ color: "var(--theme-primary)" }}
        >
          <Mail className="size-4" aria-hidden="true" />
          {contact.email}
        </a>
      </form>
    </div>
  );
}
