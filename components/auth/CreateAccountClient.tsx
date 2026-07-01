"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import AttendeeAuthCreateAccountPlate from "@/components/auth/AttendeeAuthCreateAccountPlate";
import {
  formatCreateAccountPhoneInput,
  isCreateAccountFormValid,
  serializeCreateAccountPayload,
  validateCreateAccountForm,
  type CreateAccountFormValues,
} from "@/lib/auth/create-account-validation";
import { SIGNUP_SUCCESS_MESSAGE } from "@/lib/auth/signup-messages";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";

type CreateAccountClientProps = {
  nextPath: string;
};

const INITIAL_VALUES: CreateAccountFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
  acceptedPrivacy: false,
  avatarFile: null,
};

export default function CreateAccountClient({ nextPath }: CreateAccountClientProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<CreateAccountFormValues>(INITIAL_VALUES);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const avatarPreviewUrl = useMemo(() => {
    if (!values.avatarFile) return null;
    return URL.createObjectURL(values.avatarFile);
  }, [values.avatarFile]);

  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  const fieldErrors = useMemo(
    () => (touched ? validateCreateAccountForm(values) : {}),
    [touched, values],
  );

  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const canSubmit =
    isCreateAccountFormValid(values) && Boolean(turnstileToken) && !isSubmitting;
  const loginHref = buildAttendeeGateUrl(nextPath);

  const setField = <K extends keyof CreateAccountFormValues>(
    key: K,
    value: CreateAccountFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const uploadAvatar = async () => {
    if (!values.avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", values.avatarFile);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const result = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "Unable to upload profile photo.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);

    const errors = validateCreateAccountForm(values);
    if (Object.keys(errors).length > 0) {
      const firstError =
        errors.form ??
        errors.firstName ??
        errors.lastName ??
        errors.email ??
        errors.phone ??
        errors.city ??
        errors.state ??
        errors.password ??
        errors.confirmPassword ??
        errors.acceptedTerms ??
        errors.acceptedPrivacy ??
        errors.avatarFile ??
        "Fix the highlighted fields to continue.";
      setFormError(firstError);
      return;
    }

    if (!turnstileToken) {
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
          turnstileToken,
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

      if (values.avatarFile) {
        await uploadAvatar();
      }

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
          avatarPreviewUrl={avatarPreviewUrl}
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
                fieldErrors.phone ??
                fieldErrors.city ??
                fieldErrors.state ??
                fieldErrors.password ??
                fieldErrors.confirmPassword ??
                fieldErrors.acceptedTerms ??
                fieldErrors.acceptedPrivacy ??
                fieldErrors.avatarFile ??
                "Fix the highlighted fields to continue."
              : null)
          }
          onFieldChange={(key, value) => {
            if (key === "phone") {
              setField("phone", formatCreateAccountPhoneInput(String(value)));
              return;
            }
            setField(key, value);
          }}
          onBlur={() => setTouched(true)}
          onToggleShowPassword={() => setShowPassword((current) => !current)}
          onToggleShowConfirmPassword={() => setShowConfirmPassword((current) => !current)}
          onAvatarPick={() => fileInputRef.current?.click()}
          onTurnstileTokenChange={handleTurnstileTokenChange}
          onSubmit={(event) => void handleSubmit(event)}
        />
      )}

      <input
        ref={fileInputRef}
        id={`${formId}-avatar`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setField("avatarFile", file);
        }}
        aria-label="Upload profile photo"
      />
    </>
  );
}
