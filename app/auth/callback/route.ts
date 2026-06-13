import { NextRequest, NextResponse } from "next/server";
import {
  buildAttendeeGateUrl,
  buildTeamGateUrl,
  sanitizeNextPath,
  DEFAULT_ATTENDEE_NEXT,
} from "@/lib/auth/routing";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

const DEFAULT_NEXT_PATH = DEFAULT_ATTENDEE_NEXT;

function resolveRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const host = request.headers.get("host")?.trim();

  if (forwardedProto && host) {
    return `${forwardedProto}://${host}`;
  }

  return request.nextUrl.origin;
}

function redirectToEmailGate(
  origin: string,
  errorCode: string,
  next: string | null = null,
): NextResponse {
  const nextPath = sanitizeNextPath(next, DEFAULT_NEXT_PATH);
  const gateUrl =
    nextPath.startsWith("/ops") || nextPath.startsWith("/dashboard/broadcast")
      ? buildTeamGateUrl(nextPath)
      : buildAttendeeGateUrl(nextPath);
  const url = new URL(gateUrl, origin);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const origin = resolveRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return redirectToEmailGate(
      origin,
      "auth_callback_failed",
      request.nextUrl.searchParams.get("next"),
    );
  }

  if (!code) {
    return redirectToEmailGate(
      origin,
      "auth_callback_failed",
      request.nextUrl.searchParams.get("next"),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[AUTH_CALLBACK_ERR]:", error.message);
    return redirectToEmailGate(
      origin,
      "auth_callback_failed",
      request.nextUrl.searchParams.get("next"),
    );
  }

  const nextPath = sanitizeNextPath(
    request.nextUrl.searchParams.get("next"),
    DEFAULT_NEXT_PATH,
  );
  return NextResponse.redirect(new URL(nextPath, origin));
}
