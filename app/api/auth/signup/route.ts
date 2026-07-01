import { NextRequest, NextResponse } from "next/server";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import {
  DEFAULT_ATTENDEE_NEXT,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import { buildAuthCallbackUrl } from "@/lib/auth/server";
import { syncUserProfileIdentity } from "@/lib/auth/sync-attendee-profile";
import { sanitizeSignupRequestBody } from "@/lib/auth/signup-sanitize";
import {
  buildSignupErrorResponse,
  buildSignupSuccessResponse,
  SIGNUP_CAPTCHA_MESSAGE,
  SIGNUP_GENERIC_ERROR_MESSAGE,
  SIGNUP_RATE_LIMIT_MESSAGE,
  SIGNUP_VALIDATION_MESSAGE,
} from "@/lib/auth/signup-messages";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";

function jsonResponse(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

function logSignupFailure(reason: string, detail: Record<string, unknown> = {}): void {
  console.error("[AUTH_SIGNUP_ERR]:", reason, detail);
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = resolveClientIp(request);
    const rateLimit = await consumeRateLimit("signup", clientIp);

    if (!rateLimit.allowed) {
      return jsonResponse(buildSignupErrorResponse(SIGNUP_RATE_LIMIT_MESSAGE), 429);
    }

    const rawBody: unknown = await request.json();
    const sanitized = sanitizeSignupRequestBody(rawBody);

    if (!sanitized.ok) {
      return jsonResponse(buildSignupErrorResponse(SIGNUP_VALIDATION_MESSAGE), 400);
    }

    const payload = sanitized.data;
    const passwordStrength = evaluatePasswordStrength(payload.password);

    if (!passwordStrength.isValid) {
      return jsonResponse(buildSignupErrorResponse(SIGNUP_VALIDATION_MESSAGE), 400);
    }

    const turnstile = await verifyTurnstileToken(payload.turnstileToken, clientIp);
    if (!turnstile.ok) {
      logSignupFailure("turnstile_rejected", { errorCodes: turnstile.errorCodes });
      return jsonResponse(buildSignupErrorResponse(SIGNUP_CAPTCHA_MESSAGE), 400);
    }

    const signupNext = resolveAttendeeDestination(payload.next ?? DEFAULT_ATTENDEE_NEXT);
    const fullName = `${payload.firstName} ${payload.lastName}`.trim();

    const { supabase, getResponse } = createRouteHandlerSupabaseClient(request, () =>
      jsonResponse(buildSignupSuccessResponse(false), 200),
    );

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          is_guest: false,
          first_name: payload.firstName,
          last_name: payload.lastName,
          full_name: fullName,
        },
        emailRedirectTo: buildAuthCallbackUrl(signupNext, request),
      },
    });

    if (error) {
      logSignupFailure("supabase_signup_failed", { code: error.code, status: error.status });
      return jsonResponse(buildSignupSuccessResponse(true), 200);
    }

    if (!data.user) {
      logSignupFailure("supabase_signup_missing_user");
      return jsonResponse(buildSignupSuccessResponse(true), 200);
    }

    const needsVerification = !data.session;

    if (data.session && data.user) {
      await syncUserProfileIdentity(data.user);
      return getResponse();
    }

    return jsonResponse(buildSignupSuccessResponse(needsVerification), 200);
  } catch (error) {
    logSignupFailure("unexpected_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonResponse(buildSignupErrorResponse(SIGNUP_GENERIC_ERROR_MESSAGE), 500);
  }
}
