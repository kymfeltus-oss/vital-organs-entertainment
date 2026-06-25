"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import EmailGateShell, {
  gateFieldClass,
  PrimaryGateButton,
  ValidationHint,
} from "@/components/auth/EmailGateShell";
import {
  buildGateUrl,
  buildTeamPostAuthUrl,
  PERSONA_HUB_PATH,
  resolveTeamDestination,
} from "@/lib/auth/routing";
import { emailValidationState } from "@/lib/auth/validation";

type TeamLoginClientProps = {
  nextPath: string;
  authError?: string | null;
};

export default function TeamLoginClient({ nextPath, authError }: TeamLoginClientProps) {
  const resolvedNext = resolveTeamDestination(nextPath);
  const hubBackHref = buildGateUrl(PERSONA_HUB_PATH, resolvedNext);
  const postAuthHref = buildTeamPostAuthUrl(resolvedNext);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const isCountdownOps =
    resolvedNext === "/ops/countdown" || resolvedNext.startsWith("/ops/countdown/");

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

  useEffect(() => {
    const shell = shellRef.current;
    const main = shell?.closest("main");
    const viewportH = window.innerHeight;
    const shellH = shell?.clientHeight ?? 0;
    const shellScrollH = shell?.scrollHeight ?? 0;
    const mainH = main?.clientHeight ?? 0;
    const mainOverflow = main ? getComputedStyle(main).overflowY : "unknown";
    const shellOverflow = shell ? getComputedStyle(shell).overflowY : "unknown";
    const canScroll = shell ? shellScrollH > shellH + 2 && shellOverflow !== "hidden" : false;
    const isClipped = shellScrollH > shellH + 2 && !canScroll;
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
      body: JSON.stringify({
        sessionId: "675ed0",
        runId: "post-fix",
        hypothesisId: "A-B-C",
        location: "TeamLoginClient.tsx:mount",
        message: "team gate layout metrics",
        data: {
          viewportH,
          shellH,
          shellScrollH,
          mainH,
          mainOverflow,
          isClipped,
          canScroll,
          shellOverflow,
          resolvedNext,
          hubBackHref,
          postAuthHref,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [hubBackHref, postAuthHref, resolvedNext]);

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

      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
        body: JSON.stringify({
          sessionId: "675ed0",
          runId: "team-gate-layout",
          hypothesisId: "E",
          location: "TeamLoginClient.tsx:submit",
          message: "team sign-in redirect",
          data: { postAuthHref },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      window.location.assign(postAuthHref);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Team authentication failed");
      setStatus("idle");
    }
  };

  return (
    <EmailGateShell
      shellRef={shellRef}
      layout="fluid"
      eyebrow={isCountdownOps ? "Ops Console" : "Production Access"}
      title={isCountdownOps ? "Countdown Hero Editor" : "Promoter & Team Login"}
      description={
        isCountdownOps
          ? "Sign in to configure the attendee holding-room countdown on /live."
          : "Secure credentials for PARABLE broadcast control and operator live hub consoles."
      }
      backHref={hubBackHref}
      onBackNavigate={() => {
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
          body: JSON.stringify({
            sessionId: "675ed0",
            runId: "team-gate-layout",
            hypothesisId: "D",
            location: "TeamLoginClient.tsx:back",
            message: "team back navigation",
            data: { hubBackHref },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }}
    >
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
            Password
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
              Signing in...
            </>
          ) : isCountdownOps ? (
            "Continue to Countdown Editor"
          ) : (
            "Sign In — Choose Console"
          )}
        </PrimaryGateButton>
      </form>

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
