import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import {
  DEFAULT_ATTENDEE_NEXT,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import { buildAuthCallbackUrl } from "@/lib/auth/server";
import {
  buildSignupErrorResponse,
  RESEND_VERIFICATION_SUCCESS_MESSAGE,
  SIGNUP_GENERIC_ERROR_MESSAGE,
  SIGNUP_RATE_LIMIT_MESSAGE,
} from "@/lib/auth/signup-messages";
import { isValidEmail } from "@/lib/auth/validation";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";

function jsonResponse(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = resolveClientIp(request);
    const rateLimit = await consumeRateLimit("resend-verification", clientIp);

    if (!rateLimit.allowed) {
      return jsonResponse(buildSignupErrorResponse(SIGNUP_RATE_LIMIT_MESSAGE), 429);
    }

    const body = (await request.json()) as { email?: string; next?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !isValidEmail(email)) {
      return jsonResponse(
        { success: true, message: RESEND_VERIFICATION_SUCCESS_MESSAGE },
        200,
      );
    }

    const signupNext = resolveAttendeeDestination(body.next ?? DEFAULT_ATTENDEE_NEXT);

    const { supabase } = createRouteHandlerSupabaseClient(
      request,
      () => NextResponse.json({ success: true }),
    );

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(signupNext, request),
      },
    });

    if (error) {
      console.error("[AUTH_RESEND_VERIFICATION_ERR]:", error.code ?? error.message);
    }

    return jsonResponse({ success: true, message: RESEND_VERIFICATION_SUCCESS_MESSAGE }, 200);
  } catch (error) {
    console.error("[AUTH_RESEND_VERIFICATION_ERR]:", error);
    return jsonResponse(buildSignupErrorResponse(SIGNUP_GENERIC_ERROR_MESSAGE), 500);
  }
}
