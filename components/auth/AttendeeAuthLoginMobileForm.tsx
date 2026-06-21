"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  LOGIN_BAKED_FIELD_MASKS,
  LOGIN_FIELD_SLOTS,
  type LoginOverlayRect,
} from "@/lib/auth/login-mobile-slots";
import type { CSSProperties, ReactNode } from "react";

type AttendeeAuthLoginMobileFormProps = {
  createAccountHref: string;
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  formError?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailBlur: () => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function slotStyle(rect: LoginOverlayRect): CSSProperties {
  return {
    position: "absolute",
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
  rect: LoginOverlayRect;
  children: ReactNode;
}) {
  return (
    <div className="login-form__slot" style={slotStyle(rect)}>
      {children}
    </div>
  );
}

export default function AttendeeAuthLoginMobileForm({
  createAccountHref,
  email,
  password,
  showPassword,
  rememberMe,
  isSubmitting,
  formError,
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
}: AttendeeAuthLoginMobileFormProps) {
  return (
    <div className="login-overlay pointer-events-none absolute inset-0 z-[3] size-full">
      {LOGIN_BAKED_FIELD_MASKS.map((rect, index) => (
        <div
          key={`login-field-mask-${index}`}
          className="login-form__field-mask"
          style={slotStyle(rect)}
          aria-hidden="true"
        />
      ))}

      <form
        onSubmit={onSubmit}
        className="login-form pointer-events-auto"
        aria-label="Log in"
        noValidate
      >
        <FormSlot rect={LOGIN_FIELD_SLOTS.email}>
          <label className="login-form__field">
            <input
              id="auth-login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              disabled={isSubmitting}
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              onBlur={onEmailBlur}
              placeholder=""
              aria-label="Email address"
              className="login-form__control font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={LOGIN_FIELD_SLOTS.password}>
          <label className="login-form__field login-form__field--password">
            <input
              id="auth-login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="current-password"
              enterKeyHint="done"
              disabled={isSubmitting}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder=""
              aria-label="Password"
              className="login-form__control login-form__control--password font-body"
            />
            <button
              type="button"
              className="login-form__password-toggle touch-target"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isSubmitting}
              onClick={onToggleShowPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </label>
        </FormSlot>

        <FormSlot rect={LOGIN_FIELD_SLOTS.options}>
          <div className="login-form__options">
            <label className="login-form__remember touch-target font-body">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={isSubmitting}
                onChange={(event) => onRememberMeChange(event.target.checked)}
                className="login-form__remember-checkbox"
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              aria-label="Forgot password — coming soon"
              className="login-form__forgot touch-target font-ui"
            >
              Forgot Password?
            </button>
          </div>
        </FormSlot>

        <FormSlot rect={LOGIN_FIELD_SLOTS.submit}>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Log in"
            className="login-form__submit touch-target font-ui size-full"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
            ) : (
              <span className="sr-only">Log in</span>
            )}
          </button>
        </FormSlot>

        <FormSlot rect={LOGIN_FIELD_SLOTS.socialRow}>
          <div className="login-form__social-row" role="group" aria-label="Social sign in">
            <button
              type="button"
              disabled={isSubmitting}
              aria-label="Continue with Apple — coming soon"
              className="login-form__social-btn touch-target font-ui"
            >
              <span className="sr-only">Apple</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              aria-label="Continue with Google — coming soon"
              className="login-form__social-btn touch-target font-ui"
            >
              <span className="sr-only">Google</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              aria-label="Continue with Facebook — coming soon"
              className="login-form__social-btn touch-target font-ui"
            >
              <span className="sr-only">Facebook</span>
            </button>
          </div>
        </FormSlot>

        <FormSlot rect={LOGIN_FIELD_SLOTS.signUp}>
          <p className="login-form__sign-up font-body">
            Don&apos;t have an account?{" "}
            <Link href={createAccountHref} className="login-form__sign-up-link font-ui">
              Sign Up
            </Link>
          </p>
        </FormSlot>

        {formError ? (
          <p role="alert" className="login-form__error font-body">
            {formError}
          </p>
        ) : null}
      </form>
    </div>
  );
}
