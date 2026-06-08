"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchLiveAccessEvaluation,
  type LiveAccessEvaluation,
} from "@/lib/access";

export const PASS_ACTIVATION_POLL_INTERVAL_MS = 1_500;
export const PASS_ACTIVATION_MAX_ATTEMPTS = 20;

export type LiveAccessPhase =
  | "checking"
  | "activating_pass"
  | "locked"
  | "guest_hub"
  | "cleared";

type UseLiveAccessVerificationResult = {
  phase: LiveAccessPhase;
  evaluation: LiveAccessEvaluation | null;
  userEmail: string | null;
  userId: string | null;
  verificationAttempt: number;
  rerunVerification: () => Promise<void>;
};

function resolvePhase(evaluation: LiveAccessEvaluation): LiveAccessPhase {
  if (evaluation.canViewStream) return "cleared";
  if (evaluation.showStreamPaywall) return "guest_hub";
  if (evaluation.showFullLockdown) return "locked";
  return "locked";
}

function clearCheckoutSuccessParam(): void {
  window.history.replaceState({}, "", "/dashboard/live");
}

/**
 * Server-backed live access gate for /dashboard/live.
 * Post-checkout returns (`?success=true`) enter activating_pass and poll
 * /api/access/live until the Stripe webhook fulfills the ticket order.
 */
export function useLiveAccessVerification(): UseLiveAccessVerificationResult {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<LiveAccessPhase>("checking");
  const [evaluation, setEvaluation] = useState<LiveAccessEvaluation | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  const applyEvaluation = useCallback((next: LiveAccessEvaluation) => {
    setEvaluation(next);
    setUserEmail(next.email);
    setUserId(next.userId);
    setPhase(resolvePhase(next));
  }, []);

  const rerunVerification = useCallback(async () => {
    setPhase("checking");
    const next = await fetchLiveAccessEvaluation();
    applyEvaluation(next);
  }, [applyEvaluation]);

  useEffect(() => {
    let cancelled = false;
    const returnedFromCheckout = searchParams.get("success") === "true";

    async function pollPassActivation() {
      setPhase("activating_pass");
      setVerificationAttempt(1);

      let lastEvaluation: LiveAccessEvaluation | null = null;

      for (let attempt = 0; attempt < PASS_ACTIVATION_MAX_ATTEMPTS; attempt += 1) {
        if (cancelled) return;

        try {
          const next = await fetchLiveAccessEvaluation();
          lastEvaluation = next;
          setEvaluation(next);
          setUserEmail(next.email);
          setUserId(next.userId);
          setVerificationAttempt(attempt + 1);

          if (next.canViewStream) {
            clearCheckoutSuccessParam();
            setPhase("cleared");
            return;
          }
        } catch (error) {
          console.error("Live access verification error:", error);
        }

        if (attempt < PASS_ACTIVATION_MAX_ATTEMPTS - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, PASS_ACTIVATION_POLL_INTERVAL_MS),
          );
        }
      }

      if (cancelled) return;

      clearCheckoutSuccessParam();

      if (lastEvaluation) {
        applyEvaluation(lastEvaluation);
        return;
      }

      setPhase("locked");
    }

    async function runInitialVerification() {
      setPhase("checking");
      setVerificationAttempt(1);

      try {
        const next = await fetchLiveAccessEvaluation();
        if (cancelled) return;
        applyEvaluation(next);
      } catch (error) {
        console.error("Live access verification error:", error);
        if (!cancelled) {
          setPhase("locked");
        }
      }
    }

    if (returnedFromCheckout) {
      void pollPassActivation();
    } else {
      void runInitialVerification();
    }

    return () => {
      cancelled = true;
    };
  }, [applyEvaluation, searchParams]);

  return {
    phase,
    evaluation,
    userEmail,
    userId,
    verificationAttempt,
    rerunVerification,
  };
}
