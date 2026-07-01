"use client";

import { useCallback, useMemo, useState } from "react";
import AttendeeAuthCreateAccountPlate from "@/components/auth/AttendeeAuthCreateAccountPlate";
import {
  isCreateAccountFormValid,
  serializeCreateAccountPayload,
  validateCreateAccountForm,
  type CreateAccountFormValues,
} from "@/lib/auth/create-account-validation";
import { handleSocialLogin, type OAuthProviderId } from "@/lib/auth/oauth-sign-in";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { SIGNUP_SUCCESS_MESSAGE } from "@/lib/auth/signup-messages";
import { isTurnstileWidgetEnabled } from "@/lib/auth/turnstile-config";

type CreateAccountClientProps = {
  nextPath: string;
};

const INITIAL_VALUES: CreateAccountFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
  acceptedPrivacy: false,
};

export default function CreateAccountClient({ nextPath }: CreateAccountClientProps) {
  const [values, setValues] = useState<CreateAccountFormValues>(INITIAL_VALUES);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const fieldErrors = useMemo(
    () => (touched ? validateCreateAccountForm(values) : {}),
    [touched, values],
  );

  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const handleOAuthSignIn = async (provider: OAuthProviderId) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    const result = await handleSocialLogin(provider, nextPath);

    if (result.error) {
      setFormError(result.error);
      setIsSubmitting(false);
    }
  };

  const turnstileRequired = isTurnstileWidgetEnabled();

  const canSubmit =
    isCreateAccountFormValid(values) &&
    (!turnstileRequired || Boolean(turnstileToken)) &&
    !isSubmitting;
  const loginHref = buildAttendeeGateUrl(nextPath);

  const setField = <K extends keyof CreateAccountFormValues>(
    key: K,
    value: CreateAccountFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);

    const errors = validateCreateAccountForm(values);
    if (Object.keys(errors).length > 0) {
      const firstError =
        errors.firstName ??
        errors.lastName ??
        errors.email ??
        errors.password ??
        errors.confirmPassword ??
        errors.acceptedTerms ??
        errors.acceptedPrivacy ??
        "Fix the highlighted fields to continue.";
      setFormError(firstError);
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setFormError("Complete the security verification before submitting.");
      return;
    }

    if (!canSubmit) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = serializeCreateAccountPayload(values);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...payload,
          turnstileToken: turnstileToken ?? undefined,
          next: nextPath,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        needsVerification?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || result.success === false) {
        throw new Error(result.error ?? "Unable to create account.");
      }

      if (result.needsVerification !== false) {
        setConfirmationSent(true);
        setIsSubmitting(false);
        return;
      }

      await fetch("/api/auth/sync-identity", {
        method: "POST",
        credentials: "include",
      });

      window.location.assign(nextPath);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.");
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setFormError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          next: nextPath,
        }),
      });

      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok || result.success === false) {
        throw new Error(result.error ?? "Unable to resend verification email.");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {confirmationSent ? (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-10 text-center">
          <p className="font-headline text-xl uppercase tracking-[0.12em] text-white">
            Check Your Email
          </p>
          <p className="font-body text-sm text-brand-muted">
            {SIGNUP_SUCCESS_MESSAGE} We sent a confirmation link to{" "}
            <span className="text-white">{values.email}</span>. Open it on this device to finish
            setting up your account.
          </p>
          <button
            type="button"
            disabled={isResending}
            onClick={() => void handleResendVerification()}
            className="font-ui text-sm font-medium uppercase tracking-[0.1em] text-brand-blue hover:underline disabled:opacity-60"
          >
            {isResending ? "Sending…" : "Resend confirmation email"}
          </button>
          {formError ? (
            <p role="alert" className="font-body text-sm text-brand-pink">
              {formError}
            </p>
          ) : null}
          <a
            href={loginHref}
            className="font-ui text-sm font-medium uppercase tracking-[0.1em] text-brand-purple hover:underline"
          >
            Back to Log In
          </a>
        </div>
      ) : (
        <AttendeeAuthCreateAccountPlate
          loginHref={loginHref}
          values={values}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          fieldErrors={fieldErrors}
          formError={
            formError ??
            (touched && Object.keys(fieldErrors).length > 0
              ? fieldErrors.firstName ??
                fieldErrors.lastName ??
                fieldErrors.email ??
                fieldErrors.password ??
                fieldErrors.confirmPassword ??
                fieldErrors.acceptedTerms ??
                fieldErrors.acceptedPrivacy ??
                "Fix the highlighted fields to continue."
              : null)
          }
          onFieldChange={setField}
          onBlur={() => setTouched(true)}
          onToggleShowPassword={() => setShowPassword((current) => !current)}
          onToggleShowConfirmPassword={() => setShowConfirmPassword((current) => !current)}
          onTurnstileTokenChange={handleTurnstileTokenChange}
          onOAuthSignIn={(provider) => void handleOAuthSignIn(provider)}
          onSubmit={(event) => void handleSubmit(event)}
        />
      )}
    </>
  );
}
