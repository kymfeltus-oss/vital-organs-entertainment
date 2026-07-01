import { NextRequest, NextResponse } from "next/server";
import { generateGuestEmail, generateGuestPassword } from "@/lib/access";
import { syncUserProfileIdentity } from "@/lib/auth/sync-attendee-profile";
import { isValidEmail, isValidPhone, normalizePhoneDigits } from "@/lib/auth/validation";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type AuthAction = "login" | "signup" | "guest";

type AuthRequestBody = {
  action?: AuthAction;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  next?: string;
};

function jsonResponse(payload: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuthRequestBody;
    const action = body.action;

    if (!action || !["signup", "login", "guest"].includes(action)) {
      return jsonResponse({ error: "Invalid auth action." }, 400);
    }

    const { supabase, getResponse } = createRouteHandlerSupabaseClient(
      request,
      () => jsonResponse({ success: true }),
    );

    if (action === "login") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;

      if (!email || !password || !isValidEmail(email)) {
        return jsonResponse(
          { error: "Valid email and password are required." },
          400,
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return jsonResponse(
          { error: error?.message ?? "Unable to sign in." },
          401,
        );
      }

      await syncUserProfileIdentity(data.user);

      return getResponse();
    }

    if (action === "signup") {
      return jsonResponse(
        {
          error: "Signup has moved to POST /api/auth/signup.",
          redirect: "/api/auth/signup",
        },
        410,
      );
    }

    const guestEmail = generateGuestEmail();
    const guestPassword = generateGuestPassword();
    const contactEmail = body.email?.trim().toLowerCase();
    const contactPhone = body.phone?.trim();
    const admin = getSupabaseAdmin();

    const guestMetadata: Record<string, unknown> = { is_guest: true };
    if (contactEmail && isValidEmail(contactEmail)) {
      guestMetadata.contact_email = contactEmail;
    }
    if (contactPhone) {
      guestMetadata.contact_phone = contactPhone;
    }

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
        user_metadata: guestMetadata,
      });

    if (createError || !createdUser.user) {
      return jsonResponse(
        { error: createError?.message ?? "Unable to create guest session." },
        500,
      );
    }

    const { data: guestSession, error: guestSignInError } =
      await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });

    if (guestSignInError || !guestSession.user) {
      return jsonResponse(
        { error: guestSignInError?.message ?? "Unable to start guest session." },
        500,
      );
    }

    return getResponse();
  } catch (error) {
    console.error("Auth route error:", error);
    const message =
      error instanceof Error ? error.message : "Authentication failed.";
    return jsonResponse({ error: message }, 500);
  }
}
