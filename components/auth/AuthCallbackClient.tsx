"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import {
  buildAttendeeGateUrl,
  DEFAULT_ATTENDEE_NEXT,
  sanitizeNextPath,
} from "@/lib/auth/routing";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function redirectToLoginWithError(nextPath: string, confirmedOnly = false) {
  const url = new URL(buildAttendeeGateUrl(nextPath), window.location.origin);
  if (confirmedOnly) {
    url.searchParams.set("confirmed", "1");
  } else {
    url.searchParams.set("error", "auth_callback_failed");
  }
  window.location.assign(url.toString());
}

async function syncProfileIdentity(): Promise<void> {
  const response = await fetch("/api/auth/sync-identity", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    console.error("[AUTH_CALLBACK_SYNC_ERR]:", await response.text());
  }
}

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const startedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState("Confirming your email…");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function completeAuth() {
      const supabase = createBrowserSupabaseClient();
      const nextPath = sanitizeNextPath(
        searchParams.get("next"),
        DEFAULT_ATTENDEE_NEXT,
      );
      const code = searchParams.get("code");
      const tokenHash =
        searchParams.get("token_hash") ?? searchParams.get("token");
      const type = searchParams.get("type") as EmailOtpType | null;
      const oauthError = searchParams.get("error");
      const hashParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.hash.slice(1) : "",
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (oauthError) {
        redirectToLoginWithError(nextPath);
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          await syncProfileIdentity();
          window.location.assign(nextPath);
          return;
        }
      }

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (!error && data.user) {
          await syncProfileIdentity();
          window.location.assign(nextPath);
          return;
        }
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        const verifierMissing = /code verifier|both auth code and code verifier/i.test(
          error?.message ?? "",
        );
        if (!error && data.user) {
          await syncProfileIdentity();
          window.location.assign(nextPath);
          return;
        }
        if (verifierMissing) {
          setStatusMessage("Email confirmed. Redirecting to sign in…");
          redirectToLoginWithError(nextPath, true);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await syncProfileIdentity();
        window.location.assign(nextPath);
        return;
      }

      setStatusMessage("Confirmation link expired. Redirecting to sign in…");
      redirectToLoginWithError(nextPath);
    }

    void completeAuth();
  }, [searchParams]);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-brand-black px-6 text-center text-brand-muted">
      <Loader2 className="h-6 w-6 animate-spin text-brand-blue" aria-hidden="true" />
      <p className="font-ui text-sm">{statusMessage}</p>
    </div>
  );
}
