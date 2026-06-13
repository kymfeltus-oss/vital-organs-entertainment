"use client";

import { useState } from "react";
import { Loader2, Mail, Smartphone } from "lucide-react";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (!email || !password) return;

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
        body: JSON.stringify({ action: "guest" }),
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

  return (
    <EmailGateShell
      eyebrow="Attendee Entrance"
      title="Join The Awakening"
      description="Log in, create your pass account, or continue as a guest. Guest verification collects contact details before OTP confirmation."
      backHref={hubBackHref}
    >
      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-brand-border bg-brand-black p-1 font-ui text-[0.58rem] font-bold uppercase tracking-[0.08em]">
        {(
          [
            ["login", "Log In"],
            ["signup", "Create Account"],
            ["guest", "Continue as Guest"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setGuestStep("form");
              setError(null);
            }}
            className={`min-h-11 rounded-lg px-1 py-2 transition-colors ${
              activeTab === tab
                ? "border border-brand-blue/40 bg-brand-blue/15 text-white"
                : "text-brand-muted hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab !== "guest" ? (
        <form onSubmit={(e) => void handleCredentialSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="name@domain.com"
              className={gateFieldClass(emailState === "valid", emailState === "invalid")}
            />
            <ValidationHint
              valid={emailState === "valid"}
              invalid={emailState === "invalid"}
              validMessage="Valid email format"
              invalidMessage="Enter a valid email address"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                activeTab === "signup" ? "Create password (8+ chars)" : "Your password"
              }
              className={gateFieldClass(false, false)}
            />
          </div>

          <PrimaryGateButton type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing Secure Entry...
              </>
            ) : activeTab === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </PrimaryGateButton>
        </form>
      ) : (
        <form onSubmit={handleGuestFormSubmit} className="space-y-4">
          <p className="rounded-xl border border-brand-border bg-brand-panel/70 px-4 py-3 font-body text-xs leading-relaxed text-brand-muted">
            Guest entry collects email and mobile contact for verification. SMS and email OTP delivery will connect here in a later phase.
          </p>

          <div>
            <label className="mb-1.5 flex items-center gap-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
              <Mail className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="name@domain.com"
              className={gateFieldClass(emailState === "valid", emailState === "invalid")}
            />
            <ValidationHint
              valid={emailState === "valid"}
              invalid={emailState === "invalid"}
              validMessage="Valid email format"
              invalidMessage="Enter a valid email address"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
              <Smartphone className="h-3.5 w-3.5 text-brand-pink" aria-hidden="true" />
              Phone Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              required
              value={phone}
              onChange={(e) => setPhone(normalizePhoneDigits(e.target.value))}
              onBlur={() => setPhoneTouched(true)}
              placeholder="10-digit mobile number"
              className={gateFieldClass(phoneState === "valid", phoneState === "invalid")}
            />
            <ValidationHint
              valid={phoneState === "valid"}
              invalid={phoneState === "invalid"}
              validMessage="Valid 10-digit phone pattern"
              invalidMessage="Enter a 10-digit US phone number"
            />
          </div>

          <PrimaryGateButton type="submit" disabled={!guestFormValid}>
            Send Verification Code
          </PrimaryGateButton>
        </form>
      )}

      {displayError ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-4 py-3 text-center font-body text-sm text-white"
        >
          {displayError}
        </p>
      ) : null}
    </EmailGateShell>
  );
}
