import { NextResponse } from "next/server";
import { generateGuestEmail, generateGuestPassword } from "@/lib/access";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type AuthAction = "signup" | "login" | "guest";

type AuthRequestBody = {
  action?: AuthAction;
  email?: string;
  password?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function resolveRequestOrigin(request: Request): string {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const host = request.headers.get("host")?.trim();

  if (forwardedProto && host) {
    return `${forwardedProto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuthRequestBody;
    const action = body.action;

    if (!action || !["signup", "login", "guest"].includes(action)) {
      return NextResponse.json({ error: "Invalid auth action." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    if (action === "login") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;

      if (!email || !password || !isValidEmail(email)) {
        return NextResponse.json(
          { error: "Valid email and password are required." },
          { status: 400 },
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message ?? "Unable to sign in." },
          { status: 401 },
        );
      }

      return NextResponse.json({
        success: true,
        email: data.user.email,
        isGuest: data.user.user_metadata?.is_guest === true,
      });
    }

    if (action === "signup") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;

      if (!email || !password || password.length < 8 || !isValidEmail(email)) {
        return NextResponse.json(
          { error: "Valid email and an 8+ character password are required." },
          { status: 400 },
        );
      }

      const origin = resolveRequestOrigin(request);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { is_guest: false },
          emailRedirectTo: `${origin}/auth/callback?next=/experience`,
        },
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message ?? "Unable to create account." },
          { status: 400 },
        );
      }

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          return NextResponse.json(
            {
              error:
                "Account created. Confirm your email or retry sign-in if confirmation is disabled.",
            },
            { status: 202 },
          );
        }
      }

      return NextResponse.json({
        success: true,
        email,
        isGuest: false,
      });
    }

    const guestEmail = generateGuestEmail();
    const guestPassword = generateGuestPassword();
    const admin = getSupabaseAdmin();

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
        user_metadata: { is_guest: true },
      });

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Unable to create guest session." },
        { status: 500 },
      );
    }

    const { data: guestSession, error: guestSignInError } =
      await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });

    if (guestSignInError || !guestSession.user) {
      return NextResponse.json(
        { error: guestSignInError?.message ?? "Unable to start guest session." },
        { status: 500 },
      );
    }

      return NextResponse.json({
        success: true,
        email: guestEmail,
        isGuest: true,
      });
  } catch (error) {
    console.error("Auth route error:", error);
    const message =
      error instanceof Error ? error.message : "Authentication failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
