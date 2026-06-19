import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  buildAttendeeGateUrl,
  buildTeamGateUrl,
  sanitizeNextPath,
  DEFAULT_ATTENDEE_NEXT,
} from "@/lib/auth/routing";
import { getAuthAppUrl } from "@/lib/auth/server";
import { syncUserProfileIdentity } from "@/lib/auth/sync-attendee-profile";
import { createRequestBoundSupabase } from "@/lib/checkout/server";

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7242/ingest/b099d1c0-1a80-4406-8559-4df617391854";
const DEBUG_SESSION_ID = "baf5b9";

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function redirectToEmailGate(
  origin: string,
  errorCode: string,
  next: string | null,
  withSessionCookies: (response: NextResponse) => NextResponse,
): NextResponse {
  const nextPath = sanitizeNextPath(next, DEFAULT_ATTENDEE_NEXT);
  const gateUrl =
    nextPath.startsWith("/ops") || nextPath.startsWith("/dashboard/broadcast")
      ? buildTeamGateUrl(nextPath)
      : buildAttendeeGateUrl(nextPath);
  const url = new URL(gateUrl, origin);
  url.searchParams.set("error", errorCode);
  return withSessionCookies(NextResponse.redirect(url));
}

export async function GET(request: NextRequest) {
  const origin = getAuthAppUrl(request);
  const { client, withSessionCookies } = createRequestBoundSupabase(request);
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const oauthError = searchParams.get("error");
  const nextRaw = searchParams.get("next");

  debugLog("H1", "auth/callback:GET", "callback_start", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type,
    oauthError,
    origin,
  });

  if (oauthError) {
    return redirectToEmailGate(
      origin,
      "auth_callback_failed",
      nextRaw,
      withSessionCookies,
    );
  }

  let user = null;
  let sessionError: string | null = null;

  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    sessionError = error?.message ?? null;
    user = data.user;
    debugLog("H2", "auth/callback:exchangeCode", "code_exchange", {
      ok: !error,
      error: error?.message ?? null,
    });
  } else if (tokenHash && type) {
    const { data, error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    sessionError = error?.message ?? null;
    user = data.user;
    debugLog("H2", "auth/callback:verifyOtp", "otp_verify", {
      ok: !error,
      type,
      error: error?.message ?? null,
    });
  } else {
    debugLog("H1", "auth/callback:GET", "missing_credentials", {});
    return redirectToEmailGate(
      origin,
      "auth_callback_failed",
      nextRaw,
      withSessionCookies,
    );
  }

  if (sessionError || !user) {
    console.error(
      "[AUTH_CALLBACK_ERR]:",
      sessionError ?? "no user after session exchange",
    );
    return redirectToEmailGate(
      origin,
      "auth_callback_failed",
      nextRaw,
      withSessionCookies,
    );
  }

  void syncUserProfileIdentity(user).catch((syncError) => {
    console.error(
      "[AUTH_CALLBACK_SYNC_ERR]:",
      syncError instanceof Error ? syncError.message : syncError,
    );
  });

  const nextPath = sanitizeNextPath(nextRaw, DEFAULT_ATTENDEE_NEXT);
  debugLog("H3", "auth/callback:GET", "redirect_success", {
    nextPath,
    userId: user.id,
  });

  return withSessionCookies(NextResponse.redirect(new URL(nextPath, origin)));
}
