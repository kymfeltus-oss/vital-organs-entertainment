"use client";

import { Check, X } from "lucide-react";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";

type PasswordStrengthMeterProps = {
  password: string;
  showFeedback?: boolean;
};

export default function PasswordStrengthMeter({
  password,
  showFeedback = true,
}: PasswordStrengthMeterProps) {
  const strength = evaluatePasswordStrength(password);
  const hasInput = password.length > 0;

  if (!showFeedback && !hasInput) {
    return null;
  }

  const progressPercent = hasInput
    ? Math.round((strength.score / strength.maxScore) * 100)
    : 0;

  const barColor = !hasInput
    ? "bg-brand-border"
    : strength.isValid
      ? "bg-brand-blue"
      : strength.score >= 3
        ? "bg-brand-purple"
        : "bg-brand-pink";

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-brand-border/80"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Password strength"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {strength.checks.map((check) => {
          const passed = hasInput && check.passed;
          const failed = hasInput && !check.passed;

          return (
            <li
              key={check.id}
              className={`flex items-center gap-2 font-body text-xs ${
                passed
                  ? "text-brand-blue"
                  : failed
                    ? "text-brand-pink"
                    : "text-brand-muted"
              }`}
            >
              {passed ? (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              ) : failed ? (
                <X className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <span className="inline-block size-3.5 shrink-0 rounded-full border border-brand-border" />
              )}
              {check.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
