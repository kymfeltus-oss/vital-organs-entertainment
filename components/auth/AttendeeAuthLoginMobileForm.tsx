"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import {
  LOGIN_BAKED_FORM_MASK,
  LOGIN_FORM_PANEL,
  type LoginOverlayRect,
} from "@/lib/auth/login-mobile-slots";
import type { CSSProperties } from "react";

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

function panelStyle(rect: LoginOverlayRect): CSSProperties {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
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
    <div
      className="login-overlay pointer-events-none absolute inset-0 z-2 size-full"
      style={
        {
          "--login-baked-mask-top": LOGIN_BAKED_FORM_MASK.top,
          "--login-baked-mask-height": LOGIN_BAKED_FORM_MASK.height,
        } as CSSProperties
      }
    >
      <div className="login-overlay__baked-mask" aria-hidden="true" />

      <form
        onSubmit={onSubmit}
        className="login-form auth-plate-form pointer-events-auto"
        style={panelStyle(LOGIN_FORM_PANEL)}
        aria-label="Log in"
        noValidate
      >
        <label className="auth-plate-field">
          <Mail className="auth-plate-field__icon" aria-hidden="true" />
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
            placeholder="Email Address"
            aria-label="Email address"
            className="auth-plate-field__control font-body"
          />
        </label>

        <label className="auth-plate-field auth-plate-field--password">
          <Lock className="auth-plate-field__icon" aria-hidden="true" />
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
            placeholder="Password"
            aria-label="Password"
            className="auth-plate-field__control font-body"
          />
          <button
            type="button"
            className="auth-plate-field__toggle touch-target"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-plate-submit touch-target font-ui"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <span>Log In</span>
          )}
        </button>

        <p className="login-form__social-label font-ui" aria-hidden="true">
          Or Continue With
        </p>

        <div className="login-form__social-row" role="group" aria-label="Social sign in">
          <button
            type="button"
            disabled={isSubmitting}
            aria-label="Continue with Apple — coming soon"
            className="login-form__social-btn touch-target font-ui"
          >
            Apple
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            aria-label="Continue with Google — coming soon"
            className="login-form__social-btn touch-target font-ui"
          >
            Google
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            aria-label="Continue with Facebook — coming soon"
            className="login-form__social-btn touch-target font-ui"
          >
            Facebook
          </button>
        </div>

        <p className="auth-plate-footer-prompt font-body">
          Don&apos;t have an account?{" "}
          <Link href={createAccountHref} className="auth-plate-footer-prompt__link font-ui">
            Sign Up
          </Link>
        </p>

        {formError ? (
          <p role="alert" className="auth-plate-form-error font-body">
            {formError}
          </p>
        ) : null}
      </form>
    </div>
  );
}
