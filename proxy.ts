import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  ATTENDEE_GATE_PATH,
  AUTH_NEXT_COOKIE,
  buildTeamGateUrl,
  isAttendeeProtectedPath,
  isTeamProtectedPath,
} from "@/lib/auth/routing";
import { isE2EBypassEnabled } from "@/lib/access/e2e-bypass";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/** Fail fast when Supabase is slow/unreachable — avoids 10s hangs on client navigation. */
const PROXY_AUTH_LOOKUP_TIMEOUT_MS = 2_500;

const BASE_DOMAINS = ["localhost:3000", "parablestreaming.com", "yourplatform.com"];

function resolveRequestHeaders(request: NextRequest): Headers {
  const hostname = request.headers.get("host") || "";
  const matchedBase = BASE_DOMAINS.find((domain) => hostname.includes(domain));
  const requestHeaders = new Headers(request.headers);

  if (!matchedBase) return requestHeaders;

  const subdomain = hostname.replace(`.${matchedBase}`, "").trim();
  if (!subdomain || subdomain === "www" || subdomain === hostname) {
    return requestHeaders;
  }

  requestHeaders.set("x-tenant-id", subdomain);
  return requestHeaders;
}

function isAuthTransportError(message: string): boolean {
  return /ENOTFOUND|fetch failed|Failed to fetch|ECONNREFUSED|ETIMEDOUT|timeout|UND_ERR_CONNECT_TIMEOUT/i.test(
    message,
  );
}

function authErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    "cause" in error &&
    error.cause instanceof Error
  ) {
    return error.cause.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "unknown";
}

async function getProxyAuthUser(
  supabase: ReturnType<typeof createServerClient>,
): Promise<{ user: User | null; transportFailed: boolean }> {
  try {
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("proxy auth lookup timeout")),
          PROXY_AUTH_LOOKUP_TIMEOUT_MS,
        );
      }),
    ]);
    return { user: data.user, transportFailed: false };
  } catch (authError) {
    return {
      user: null,
      transportFailed: isAuthTransportError(authErrorMessage(authError)),
    };
  }
}

export async function proxy(request: NextRequest) {
  const requestHeaders = resolveRequestHeaders(request);
  const { pathname } = request.nextUrl;

  if (/^\/countdown/i.test(pathname)) {
    const normalized = pathname.replace(/^\/countdown/i, "/countdown");
    if (normalized !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = normalized;
      return NextResponse.redirect(url, 308);
    }
  }

  if (
    pathname.startsWith("/email-gate") ||
    pathname === ATTENDEE_GATE_PATH ||
    pathname === "/create-account" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/"
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const isAttendeeRoute = isAttendeeProtectedPath(pathname);
  const isTeamRoute = isTeamProtectedPath(pathname);

  if (isE2EBypassEnabled() && isTeamRoute) {
    console.info("⚡ [E2E BYPASS] Allowing team route without browser session:", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!isAttendeeRoute && !isTeamRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
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
            headers: requestHeaders,
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
  let authTransportFailed = false;
  const authResult = await getProxyAuthUser(supabase);
  user = authResult.user;
  authTransportFailed = authResult.transportFailed;

  if (authTransportFailed) {
    request.cookies.getAll().forEach(({ name }) => {
      if (/^sb-.*-auth-token(\.\d+)?$/.test(name)) {
        response.cookies.delete(name);
      }
    });
  }

  if (user) return response;

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
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|tenant-default).*)"],
};
