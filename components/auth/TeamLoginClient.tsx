"use client";

import { useState } from "react";
import { Loader2, Lock, Radio } from "lucide-react";
import EmailGateShell, {
  gateFieldClass,
  PrimaryGateButton,
  SecondaryGateButton,
  ValidationHint,
} from "@/components/auth/EmailGateShell";
import {
  buildPersonaHubUrl,
  buildTeamPostAuthUrl,
  sanitizeNextPath,
  DEFAULT_OPS_NEXT,
  DEFAULT_TEAM_NEXT,
} from "@/lib/auth/routing";
import { emailValidationState } from "@/lib/auth/validation";

type TeamLoginClientProps = {
  nextPath: string;
  authError?: string | null;
};

export default function TeamLoginClient({ nextPath, authError }: TeamLoginClientProps) {
  const resolvedNext = sanitizeNextPath(nextPath, DEFAULT_TEAM_NEXT);
  const hubBackHref = buildPersonaHubUrl(resolvedNext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const emailState = emailValidationState(email, emailTouched);
  const callbackFailureMessage =
    authError === "auth_callback_failed"
      ? "Email confirmation failed or expired. Sign in again or request a new confirmation email."
      : null;
  const displayError = error ?? callbackFailureMessage;

  const routeAfterAuth = () => {
    window.location.assign(buildTeamPostAuthUrl(resolvedNext));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          action: "login",
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Team authentication failed");
      }

      routeAfterAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Team authentication failed");
      setStatus("idle");
    }
  };

  return (
    <EmailGateShell
      eyebrow="Production Access"
      title="Promoter & Team Login"
      description="Secure credentials for PARABLE broadcast control and operator live hub consoles."
      backHref={hubBackHref}
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-brand-pink/30 bg-brand-pink/10 px-4 py-3">
        <Lock className="h-5 w-5 shrink-0 text-brand-pink" aria-hidden="true" />
        <p className="font-body text-xs leading-relaxed text-brand-muted">
          After sign-in, team profiles land on{" "}
          <span className="text-white">{DEFAULT_TEAM_NEXT}</span> (broadcast desk) or{" "}
          <span className="text-white">{DEFAULT_OPS_NEXT}</span> (crew terminal), depending on which console you open.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
            Team Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="producer@vitalorgansent.com"
            className={gateFieldClass(emailState === "valid", emailState === "invalid")}
          />
          <ValidationHint
            valid={emailState === "valid"}
            invalid={emailState === "invalid"}
            validMessage="Valid email format"
            invalidMessage="Enter a valid team email"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
            Secure Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Production credentials"
            className={gateFieldClass(false, false)}
          />
        </div>

        <PrimaryGateButton type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Authenticating Team Profile...
            </>
          ) : (
            "Sign In to Production Console"
          )}
        </PrimaryGateButton>
      </form>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <SecondaryGateButton onClick={routeAfterAuth}>
          <Radio className="h-4 w-4 text-brand-blue" aria-hidden="true" />
          Open Broadcast Console
        </SecondaryGateButton>
        <SecondaryGateButton
          onClick={() => window.location.assign(buildTeamPostAuthUrl(DEFAULT_OPS_NEXT))}
        >
          Open Ops Live Hub
        </SecondaryGateButton>
      </div>

      <p className="mt-4 font-body text-[0.68rem] leading-relaxed text-brand-muted">
        Placeholder routing buttons above simulate post-auth destinations without requiring credentials. Use sign-in when backend verification is enabled.
      </p>

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
