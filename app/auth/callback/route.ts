import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

const DEFAULT_NEXT_PATH = "/dashboard/live";

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

function sanitizeNextPath(next: string | null): string {
  if (!next) return DEFAULT_NEXT_PATH;

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return trimmed;
}

function redirectToEmailGate(origin: string, errorCode: string): NextResponse {
  const url = new URL("/email-gate", origin);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const origin = resolveRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return redirectToEmailGate(origin, "auth_callback_failed");
  }

  if (!code) {
    return redirectToEmailGate(origin, "auth_callback_failed");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[AUTH_CALLBACK_ERR]:", error.message);
    return redirectToEmailGate(origin, "auth_callback_failed");
  }

  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(nextPath, origin));
}
