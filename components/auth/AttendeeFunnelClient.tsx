"use client";

import { useState } from "react";
import AttendeeAuthArtboard from "@/components/auth/AttendeeAuthArtboard";
import AttendeeAuthLoginPlate from "@/components/auth/AttendeeAuthLoginPlate";
import EmailGateShell, {
  gateFieldClass,
  PrimaryGateButton,
  ValidationHint,
} from "@/components/auth/EmailGateShell";
import OtpVerificationPlaceholder from "@/components/auth/OtpVerificationPlaceholder";
import {
  buildPersonaHubUrl,
  buildAttendeeGateUrl,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import {
  emailValidationState,
  formatPhoneDisplay,
  isValidEmail,
  isValidPhone,
  normalizePhoneDigits,
  phoneValidationState,
} from "@/lib/auth/validation";

type AttendeeTab = "login" | "signup" | "guest";

type AttendeeFunnelClientProps = {
  nextPath: string;
  authError?: string | null;
};

export default function AttendeeFunnelClient({
  nextPath,
  authError = null,
}: AttendeeFunnelClientProps) {
  const destination = resolveAttendeeDestination(nextPath);
  const hubBackHref = buildPersonaHubUrl(destination);

  const [activeTab, setActiveTab] = useState<AttendeeTab>("login");
  const [guestStep, setGuestStep] = useState<"form" | "otp">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const callbackFailureMessage =
    authError === "auth_callback_failed"
      ? "Email confirmation failed or expired. Sign in again or request a new confirmation email."
      : null;
  const displayError = error ?? callbackFailureMessage;

  const emailState = emailValidationState(email, emailTouched);
  const phoneState = phoneValidationState(phone, phoneTouched);
  const guestFormValid = isValidEmail(email) && isValidPhone(phone);

  const handleAuthSuccess = () => {
    window.location.assign(destination);
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (activeTab === "signup" && (!firstName.trim() || !lastName.trim())) {
      setError("First and last name are required.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: activeTab === "signup" ? "signup" : "login",
          email: email.trim().toLowerCase(),
          password,
          ...(activeTab === "signup"
            ? {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
              }
            : {}),
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Authentication failed");
      }

      handleAuthSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setStatus("idle");
    }
  };

  const handleGuestFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPhoneTouched(true);
    if (!guestFormValid) return;
    setGuestStep("otp");
    setError(null);
  };

  const handleGuestVerificationComplete = async () => {
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "guest",
          email: email.trim().toLowerCase(),
          phone: normalizePhoneDigits(phone),
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Guest initialization failed");
      }

      handleAuthSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Guest initialization failed");
      setStatus("idle");
    }
  };

  if (activeTab === "guest" && guestStep === "otp") {
    return (
      <OtpVerificationPlaceholder
        email={email.trim().toLowerCase()}
        phone={formatPhoneDisplay(phone)}
        backHref={buildAttendeeGateUrl(destination)}
        onBack={() => setGuestStep("form")}
        onVerify={() => void handleGuestVerificationComplete()}
        isSubmitting={status === "submitting"}
        error={error}
      />
    );
  }

  if (activeTab === "guest") {
    return (
      <EmailGateShell backHref={hubBackHref} backLabel="Back to entry hub">
        <form onSubmit={handleGuestFormSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="Email"
            className={gateFieldClass(emailState === "valid", emailState === "invalid")}
          />
          <ValidationHint
            valid={emailState === "valid"}
            invalid={emailState === "invalid"}
            validMessage="Valid email"
            invalidMessage="Enter a valid email"
          />

          <input
            type="tel"
            inputMode="numeric"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(normalizePhoneDigits(e.target.value))}
            onBlur={() => setPhoneTouched(true)}
            placeholder="Phone"
            className={gateFieldClass(phoneState === "valid", phoneState === "invalid")}
          />
          <ValidationHint
            valid={phoneState === "valid"}
            invalid={phoneState === "invalid"}
            validMessage="Valid phone"
            invalidMessage="Enter a 10-digit US phone number"
          />

          <PrimaryGateButton type="submit" disabled={!guestFormValid}>
            Continue
          </PrimaryGateButton>

          <button
            type="button"
            className="mt-2 w-full min-h-11 font-ui text-xs text-brand-muted underline"
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Back to login
          </button>
        </form>

        {displayError ? (
          <p role="alert" className="mt-4 font-body text-sm text-brand-pink">
            {displayError}
          </p>
        ) : null}
      </EmailGateShell>
    );
  }

  return (
    <AttendeeAuthArtboard>
      <AttendeeAuthLoginPlate
        mode={activeTab}
        email={email}
        password={password}
        firstName={firstName}
        lastName={lastName}
        showPassword={showPassword}
        rememberMe={rememberMe}
        isSubmitting={status === "submitting"}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onEmailBlur={() => setEmailTouched(true)}
        onToggleShowPassword={() => setShowPassword((current) => !current)}
        onRememberMeChange={setRememberMe}
        onSubmit={(event) => void handleCredentialSubmit(event)}
        onCreateAccount={() => {
          setActiveTab("signup");
          setError(null);
        }}
        onBackToLogin={() => {
          setActiveTab("login");
          setError(null);
        }}
        onGuest={() => {
          setActiveTab("guest");
          setGuestStep("form");
          setError(null);
        }}
      />

      {displayError ? (
        <p
          role="alert"
          className="auth-attendee-error font-body text-sm text-brand-pink"
        >
          {displayError}
        </p>
      ) : null}
    </AttendeeAuthArtboard>
  );
}
