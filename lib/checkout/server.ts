import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type AuthenticatedBuyer = {
  userId: string;
  email: string;
};

type CookieMutation = {
  name: string;
  value: string;
  options?: CookieOptions;
};

type RequestBoundSupabase = {
  client: SupabaseClient;
  withSessionCookies: (response: NextResponse) => NextResponse;
};

/** Bind Supabase SSR client to the active request cookie jar (never trust body email). */
export function createRequestBoundSupabase(
  request: NextRequest,
): RequestBoundSupabase {
  const pendingCookies: CookieMutation[] = [];

  const client = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value);
          const index = pendingCookies.findIndex((entry) => entry.name === cookie.name);
          if (index >= 0) {
            pendingCookies[index] = cookie;
          } else {
            pendingCookies.push(cookie);
          }
        });
      },
    },
  });

  return {
    client,
    withSessionCookies(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    },
  };
}

export function getAppUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000"
  );
}

export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("yourActual")) {
    return null;
  }
  return key;
}

/**
 * Resolve buyer identity from cryptographically verified Supabase session cookies.
 * NEVER read email or user_id from the JSON request body.
 */
export async function resolveAuthenticatedBuyer(
  request: NextRequest,
): Promise<{ buyer: AuthenticatedBuyer; withSessionCookies: RequestBoundSupabase["withSessionCookies"] } | null> {
  const { client, withSessionCookies } = createRequestBoundSupabase(request);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user?.id || !user.email) {
    return null;
  }

  return {
    buyer: {
      userId: user.id,
      email: user.email.trim().toLowerCase(),
    },
    withSessionCookies,
  };
}
