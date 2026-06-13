"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import EmailGateShell, {
  PrimaryGateButton,
  SecondaryGateButton,
} from "@/components/auth/EmailGateShell";

type OtpVerificationPlaceholderProps = {
  email: string;
  phone: string;
  backHref: string;
  onBack: () => void;
  onVerify: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export default function OtpVerificationPlaceholder({
  email,
  phone,
  backHref,
  onBack,
  onVerify,
  isSubmitting,
  error,
}: OtpVerificationPlaceholderProps) {
  return (
    <EmailGateShell
      eyebrow="Guest Verification"
      title="Verification Code Sent"
      description="This step reserves the UI shell for SMS and email OTP confirmation. Delivery and code validation will be wired in a later phase."
      backHref={backHref}
      backLabel="Back to guest form"
    >
      <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
          <div>
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
              Codes dispatched (placeholder)
            </p>
            <p className="mt-2 font-body text-sm text-white">
              Email: <span className="text-brand-muted">{email}</span>
            </p>
            <p className="mt-1 font-body text-sm text-white">
              Mobile: <span className="text-brand-muted">{phone}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
          Enter 6-digit verification code
        </p>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled
              aria-label={`Verification digit ${index + 1}`}
              placeholder="•"
              className="h-12 rounded-lg border border-brand-border bg-brand-black text-center font-headline text-lg text-white opacity-70"
            />
          ))}
        </div>
        <p className="mt-3 font-body text-xs text-brand-muted">
          OTP inputs are visual placeholders only. Resend and validation logic will attach here later.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <PrimaryGateButton disabled={isSubmitting} onClick={onVerify}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Verifying &amp; Creating Guest Session...
            </>
          ) : (
            "Verify & Continue (Placeholder)"
          )}
        </PrimaryGateButton>

        <SecondaryGateButton onClick={onBack}>Edit Contact Details</SecondaryGateButton>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-4 py-3 text-center font-body text-sm text-white"
        >
          {error}
        </p>
      ) : null}
    </EmailGateShell>
  );
}
