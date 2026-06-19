"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Upload, X } from "lucide-react";
import { useId, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  CREATE_ACCOUNT_AVATAR_MAX_BYTES,
  CREATE_ACCOUNT_MIN_PASSWORD_LENGTH,
  formatCreateAccountPhoneInput,
  isCreateAccountFormValid,
  serializeCreateAccountPayload,
  validateCreateAccountForm,
  type CreateAccountFieldErrors,
  type CreateAccountFormValues,
} from "@/lib/auth/create-account-validation";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { US_STATES } from "@/lib/auth/us-states";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";

type CreateAccountClientProps = {
  nextPath: string;
};

type NeonFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

function NeonField({ id, label, error, children }: NeonFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="auth-create-account-field">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={`auth-create-account-field__ring${error ? " auth-create-account-field__ring--invalid" : ""}`}
      >
        <div className="auth-create-account-field__inner">{children}</div>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="auth-create-account-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

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
  avatarFile: null,
};

export default function CreateAccountClient({ nextPath }: CreateAccountClientProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<CreateAccountFormValues>(INITIAL_VALUES);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fieldErrors = useMemo(
    () => (touched ? validateCreateAccountForm(values) : {}),
    [touched, values],
  );

  const canSubmit = isCreateAccountFormValid(values) && !isSubmitting;

  const setField =
    <K extends keyof CreateAccountFormValues>(key: K, value: CreateAccountFormValues[K]) => {
      setValues((current) => ({ ...current, [key]: value }));
    };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setField("avatarFile", file);

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const clearAvatar = () => {
    setField("avatarFile", null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      setFormError(errors.form ?? "Fix the highlighted fields to continue.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...serializeCreateAccountPayload(values),
          next: nextPath,
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Unable to create account.");
      }

      if (values.avatarFile) {
        await uploadAvatar();
      }

      window.location.assign(nextPath);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.");
      setIsSubmitting(false);
    }
  };

  const loginHref = buildAttendeeGateUrl(nextPath);

  return (
    <main className="auth-create-account pt-safe pb-safe">
      <div className="auth-create-account__shell">
        <header className="auth-create-account__header">
          <div className="auth-create-account__logo-wrap">
            <Image
              src={AWAKENING_ASSETS.logo}
              alt="300 Awakening"
              width={220}
              height={72}
              priority
              className="auth-create-account__logo"
            />
          </div>
          <p className="auth-create-account__eyebrow font-ui">Vital Organs Entertainment</p>
          <h1 className="auth-create-account__title font-headline">Create Account</h1>
          <p className="auth-create-account__subtitle font-body">
            Join the 300 Awakening live experience.
          </p>
        </header>

        <form
          id={formId}
          onSubmit={(event) => void handleSubmit(event)}
          className="auth-create-account__form"
          noValidate
        >
          <div className="auth-create-account__name-grid">
            <NeonField id={`${formId}-first-name`} label="First name" error={fieldErrors.firstName}>
              <input
                id={`${formId}-first-name`}
                type="text"
                autoComplete="given-name"
                required
                value={values.firstName}
                onChange={(event) => setField("firstName", event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="First Name"
                className="auth-create-account__input"
              />
            </NeonField>

            <NeonField id={`${formId}-last-name`} label="Last name" error={fieldErrors.lastName}>
              <input
                id={`${formId}-last-name`}
                type="text"
                autoComplete="family-name"
                required
                value={values.lastName}
                onChange={(event) => setField("lastName", event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Last Name"
                className="auth-create-account__input"
              />
            </NeonField>
          </div>

          <NeonField id={`${formId}-email`} label="Email address" error={fieldErrors.email}>
            <input
              id={`${formId}-email`}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Email Address"
              className="auth-create-account__input"
            />
          </NeonField>

          <NeonField id={`${formId}-phone`} label="Phone number" error={fieldErrors.phone}>
            <input
              id={`${formId}-phone`}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              value={values.phone}
              onChange={(event) =>
                setField("phone", formatCreateAccountPhoneInput(event.target.value))
              }
              onBlur={() => setTouched(true)}
              placeholder="Phone Number"
              className="auth-create-account__input"
            />
          </NeonField>

          <NeonField id={`${formId}-city`} label="City" error={fieldErrors.city}>
            <input
              id={`${formId}-city`}
              type="text"
              autoComplete="address-level2"
              required
              value={values.city}
              onChange={(event) => setField("city", event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="City"
              className="auth-create-account__input"
            />
          </NeonField>

          <NeonField id={`${formId}-state`} label="State" error={fieldErrors.state}>
            <select
              id={`${formId}-state`}
              required
              value={values.state}
              onChange={(event) => setField("state", event.target.value)}
              onBlur={() => setTouched(true)}
              className="auth-create-account__select"
              aria-label="State"
            >
              <option value="" disabled>
                State
              </option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </NeonField>

          <NeonField id={`${formId}-password`} label="Password" error={fieldErrors.password}>
            <div className="auth-create-account__password-wrap">
              <input
                id={`${formId}-password`}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={CREATE_ACCOUNT_MIN_PASSWORD_LENGTH}
                value={values.password}
                onChange={(event) => setField("password", event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Password"
                className="auth-create-account__input auth-create-account__input--password"
              />
              <button
                type="button"
                className="auth-create-account__toggle touch-target"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </NeonField>

          <NeonField
            id={`${formId}-confirm-password`}
            label="Confirm password"
            error={fieldErrors.confirmPassword}
          >
            <div className="auth-create-account__password-wrap">
              <input
                id={`${formId}-confirm-password`}
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={CREATE_ACCOUNT_MIN_PASSWORD_LENGTH}
                value={values.confirmPassword}
                onChange={(event) => setField("confirmPassword", event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Confirm Password"
                className="auth-create-account__input auth-create-account__input--password"
              />
              <button
                type="button"
                className="auth-create-account__toggle touch-target"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </NeonField>

          <div className="auth-create-account-upload">
            <p className="auth-create-account-upload__label font-ui">Upload Photo</p>
            <div className="auth-create-account-upload__card">
              {avatarPreviewUrl ? (
                <div className="auth-create-account-upload__preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreviewUrl}
                    alt="Selected profile preview"
                    className="auth-create-account-upload__preview-img"
                  />
                  <button
                    type="button"
                    className="auth-create-account-upload__remove touch-target"
                    onClick={clearAvatar}
                    aria-label="Remove selected photo"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="auth-create-account-upload__trigger touch-target"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 text-brand-blue" aria-hidden="true" />
                  <span className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
                    Tap to upload JPG, PNG, or WebP
                  </span>
                  <span className="font-body text-xs text-brand-muted">Optional · Max 5 MB</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
            {avatarPreviewUrl ? (
              <button
                type="button"
                className="auth-create-account-upload__replace font-ui"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace photo
              </button>
            ) : null}
            {fieldErrors.avatarFile ? (
              <p role="alert" className="auth-create-account-field__error">
                {fieldErrors.avatarFile}
              </p>
            ) : null}
          </div>

          <label className="auth-create-account-terms">
            <input
              type="checkbox"
              checked={values.acceptedTerms}
              onChange={(event) => setField("acceptedTerms", event.target.checked)}
              onBlur={() => setTouched(true)}
              required
              className="auth-create-account-terms__checkbox"
            />
            <span className="auth-create-account-terms__copy font-body">
              I agree to the{" "}
              <Link href="/legal/terms" className="auth-create-account-terms__link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="auth-create-account-terms__link">
                Privacy Policy
              </Link>
            </span>
          </label>
          {fieldErrors.acceptedTerms ? (
            <p role="alert" className="auth-create-account-field__error">
              {fieldErrors.acceptedTerms}
            </p>
          ) : null}

          {formError ? (
            <p role="alert" className="auth-create-account__form-error font-body">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="auth-create-account-submit touch-target font-ui"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Creating Account…
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="auth-create-account-login font-body">
            Already have an account?{" "}
            <Link href={loginHref} className="auth-create-account-login__link font-ui">
              LOG IN
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
