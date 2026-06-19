import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ATTENDEE_GATE_PATH,
  AUTH_NEXT_COOKIE,
  buildTeamGateUrl,
  isAttendeeProtectedPath,
  isTeamProtectedPath,
} from "@/lib/auth/routing";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/email-gate") ||
    pathname === ATTENDEE_GATE_PATH ||
    pathname === "/create-account" ||
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
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (authError) {
    const cause =
      authError instanceof Error &&
      "cause" in authError &&
      authError.cause instanceof Error
        ? authError.cause.message
        : authError instanceof Error
          ? authError.message
          : "unknown";

    if (/ENOTFOUND|fetch failed|Failed to fetch|ECONNREFUSED|ETIMEDOUT/i.test(cause)) {
      request.cookies.getAll().forEach(({ name }) => {
        if (/^sb-.*-auth-token(\.\d+)?$/.test(name)) {
          response.cookies.delete(name);
        }
      });
    }
  }

  if (user) {
    return response;
  }

  const nextPath = `${pathname}${request.nextUrl.search}`;

  if (isTeamRoute) {
    const redirectUrl = new URL(buildTeamGateUrl(nextPath), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL(ATTENDEE_GATE_PATH, request.url);
  const redirectResponse = NextResponse.redirect(redirectUrl);
  redirectResponse.cookies.set(AUTH_NEXT_COOKIE, nextPath, {
    path: "/",
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  return redirectResponse;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/attendee-dashboard",
    "/experience",
    "/experience/:path*",
    "/ops",
    "/ops/:path*",
  ],
};
