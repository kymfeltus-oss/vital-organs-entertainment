import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildAttendeeGateUrl,
  buildTeamGateUrl,
  isAttendeeProtectedPath,
  isTeamProtectedPath,
} from "@/lib/auth/routing";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "post-fix",
      hypothesisId: "H1",
      location: "proxy.ts:entry",
      message: "proxy invoked",
      data: { pathname },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (
    pathname.startsWith("/email-gate") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const isAttendeeRoute = isAttendeeProtectedPath(pathname);
  const isTeamRoute = isTeamProtectedPath(pathname);

  if (!isAttendeeRoute && !isTeamRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "post-fix",
        hypothesisId: "H3",
        location: "proxy.ts:authenticated",
        message: "proxy allowing authenticated request",
        data: { pathname, hasUser: true },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return response;
  }

  const nextPath = `${pathname}${request.nextUrl.search}`;

  if (isTeamRoute) {
    const redirectUrl = new URL(buildTeamGateUrl(nextPath), request.url);
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "post-fix",
        hypothesisId: "H4",
        location: "proxy.ts:team-redirect",
        message: "proxy redirecting team route",
        data: { pathname, redirect: redirectUrl.pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL(buildAttendeeGateUrl(nextPath), request.url);
  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "post-fix",
      hypothesisId: "H4",
      location: "proxy.ts:attendee-redirect",
      message: "proxy redirecting attendee route",
      data: { pathname, redirect: redirectUrl.pathname },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/experience",
    "/experience/:path*",
    "/ops",
    "/ops/:path*",
  ],
};
