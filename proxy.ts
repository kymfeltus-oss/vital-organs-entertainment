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
  const allCookies = request.cookies.getAll();
  const cookieHeaderBytes = allCookies.reduce(
    (total, cookie) => total + cookie.name.length + (cookie.value?.length ?? 0) + 2,
    0,
  );
  const authCookieNames = allCookies
    .filter(({ name }) => /^sb-.*-auth-token(\.\d+)?$/.test(name))
    .map(({ name }) => name);

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "baf5b9",
    },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "431-debug",
      hypothesisId: "H1",
      location: "proxy.ts:entry",
      message: "Incoming request cookie footprint",
      data: {
        pathname,
        cookieCount: allCookies.length,
        cookieHeaderBytes,
        authCookieCount: authCookieNames.length,
        authCookieNames,
        nearLimit: cookieHeaderBytes > 12000,
        overLimit: cookieHeaderBytes > 16384,
      },
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

        const incomingNames = new Set(cookiesToSet.map((cookie) => cookie.name));
        request.cookies.getAll().forEach(({ name }) => {
          if (/^sb-.*-auth-token(\.\d+)?$/.test(name) && !incomingNames.has(name)) {
            response.cookies.delete(name);
          }
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "baf5b9",
          },
          body: JSON.stringify({
            sessionId: "baf5b9",
            runId: "431-debug",
            hypothesisId: "H2",
            location: "proxy.ts:setAll",
            message: "Supabase cookie refresh",
            data: {
              pathname,
              incomingCookieNames: cookiesToSet.map((cookie) => cookie.name),
              deletedStaleAuthChunks: request.cookies
                .getAll()
                .filter(
                  ({ name }) =>
                    /^sb-.*-auth-token(\.\d+)?$/.test(name) && !incomingNames.has(name),
                )
                .map(({ name }) => name),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
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
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "baf5b9",
      },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "431-debug",
        hypothesisId: "H3",
        location: "proxy.ts:authenticated",
        message: "Authenticated proxy pass-through",
        data: { pathname, userIdPresent: Boolean(user.id) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return response;
  }

  const nextPath = `${pathname}${request.nextUrl.search}`;

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "baf5b9",
    },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "431-debug",
      hypothesisId: "H4",
      location: "proxy.ts:redirect",
      message: "Unauthenticated redirect to gate",
      data: { pathname, nextPath },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (isTeamRoute) {
    const redirectUrl = new URL(buildTeamGateUrl(nextPath), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL(buildAttendeeGateUrl(nextPath), request.url);
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
